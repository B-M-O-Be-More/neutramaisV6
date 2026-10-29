import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Cookies da requisição — cada teste monta os que precisa.
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name in jar ? { name, value: jar[name] } : undefined,
    has: (name: string) => name in jar,
  }),
}));

// As envs são lidas na carga dos proxies: precisam existir antes do import.
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";
process.env.GEO_API_URL = "https://upstream.test/geo/api/v2";

const context = await import("@/app/api/auth/context/route");
const { POST: REFRESH } = await import("@/app/api/auth/context/refresh/route");
const { GET: GEO_LIST } = await import("@/app/api/geo/coverageFile/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

const TOKEN_PAIR = {
  access_token: "seller-access",
  refresh_token: "seller-refresh",
  token_type: "bearer",
  expires_in: 900,
  profile: "seller",
  context_version: 1,
};

const CURRENT = {
  organization_id: ORGANIZATION,
  user_id: "11111111-1111-4111-8111-111111111111",
  profile: "seller",
  roles: ["seller_owner"],
  permissions: ["geo:coverage:read"],
  kyc_level: "basic",
  kyc_state: "verified",
  transaction_eligible: true,
  profile_version: 1,
  grant_version: 1,
  context_version: 1,
};

const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const post = (path: string, body: unknown) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("BFF da sessão de perfil (/api/auth/context)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = { access_token: "login-token" };
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("POST (seleção)", () => {
    it("envia só o perfil com o token do login e guarda o par nos cookies do perfil", async () => {
      fetchMock.mockResolvedValue(json(TOKEN_PAIR));

      const response = await context.POST(
        post("/api/auth/context", { profile: "seller" }),
      );

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://upstream.test/identity/api/v1/auth/context");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer login-token");
      expect(JSON.parse(init.body)).toEqual({ profile: "seller" });

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.cookies.get("profile_access_token")?.value).toBe(
        "seller-access",
      );
      expect(response.cookies.get("profile_refresh_token")?.value).toBe(
        "seller-refresh",
      );
      // O login segue intacto e os tokens não vão para o browser.
      expect(response.cookies.get("access_token")).toBeUndefined();
      const body = await response.json();
      expect(body.data).toEqual({
        token_type: "bearer",
        expires_in: 900,
        profile: "seller",
        context_version: 1,
      });
    });

    it("recusa perfil inválido sem chamar a identity-api", async () => {
      const response = await context.POST(
        post("/api/auth/context", { profile: "admin" }),
      );

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("repassa o 403 de quem não tem o perfil liberado, sem cookies", async () => {
      fetchMock.mockResolvedValue(json({ detail: "Profile denied" }, 403));

      const response = await context.POST(
        post("/api/auth/context", { profile: "seller" }),
      );

      expect(response.status).toBe(403);
      expect(response.cookies.get("profile_access_token")).toBeUndefined();
    });
  });

  describe("GET (contexto atual)", () => {
    it("usa o token do perfil e devolve o contexto no envelope", async () => {
      jar.profile_access_token = "seller-access";
      fetchMock.mockResolvedValue(
        json(CURRENT, 200, { "X-Correlation-ID": "corr-1" }),
      );

      const response = await context.GET();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://upstream.test/identity/api/v1/auth/context");
      expect(init.headers.Authorization).toBe("Bearer seller-access");
      expect(response.headers.get("X-Correlation-ID")).toBe("corr-1");
      expect((await response.json()).data).toEqual(CURRENT);
    });

    it("responde 401 sem sessão de perfil", async () => {
      const response = await context.GET();

      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("DELETE (encerrar)", () => {
    it("revoga a família do perfil e limpa só os cookies dele", async () => {
      jar.profile_access_token = "seller-access";
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      const response = await context.DELETE();

      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe("DELETE");
      expect(init.headers.Authorization).toBe("Bearer seller-access");
      expect(response.status).toBe(204);
      expect(response.cookies.get("profile_access_token")?.value).toBe("");
      expect(response.cookies.get("access_token")).toBeUndefined();
    });
  });

  describe("POST /refresh", () => {
    it("renova com o refresh do perfil, sem Authorization, e troca o par", async () => {
      jar.profile_refresh_token = "old-refresh";
      fetchMock.mockResolvedValue(
        json({ ...TOKEN_PAIR, refresh_token: "new-refresh" }),
      );

      const response = await REFRESH();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://upstream.test/identity/api/v1/auth/context/refresh",
      );
      expect(init.headers.Authorization).toBeUndefined();
      expect(JSON.parse(init.body)).toEqual({ refresh_token: "old-refresh" });
      expect(response.cookies.get("profile_access_token")?.value).toBe(
        "seller-access",
      );
      expect(response.cookies.get("profile_refresh_token")?.value).toBe(
        "new-refresh",
      );
    });

    it("refresh recusado encerra a sessão de perfil local", async () => {
      jar.profile_refresh_token = "old-refresh";
      fetchMock.mockResolvedValue(json({ detail: "Invalid" }, 401));

      const response = await REFRESH();

      expect(response.status).toBe(401);
      expect(response.cookies.get("profile_access_token")?.value).toBe("");
      expect(response.cookies.get("profile_refresh_token")?.value).toBe("");
    });

    it("sem refresh do perfil, responde 401 sem chamar a identity-api", async () => {
      const response = await REFRESH();

      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("geo-api com a sessão de perfil", () => {
    it("usa o token do perfil no lugar do login e repassa o X-Correlation-ID", async () => {
      jar.profile_access_token = "seller-access";
      fetchMock.mockResolvedValue(
        json({ data: { items: [], total: 0, offset: 0, limit: 200 } }, 200, {
          "X-Correlation-ID": "corr-geo",
        }),
      );

      const response = await GEO_LIST(
        new NextRequest(
          new URL(
            `/api/geo/coverageFile?organization_id=${ORGANIZATION}`,
            "http://localhost",
          ),
        ),
      );

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBe("Bearer seller-access");
      expect(response.headers.get("X-Correlation-ID")).toBe("corr-geo");
    });
  });
});
