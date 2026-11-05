import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
process.env.PAYMENT_API_URL = "https://upstream.test/payment/api/v2";
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const { GET: ACCESS } =
  await import("@/app/api/payment/access/[organizationId]/route");
const { POST: ONBOARDING } = await import("@/app/api/payment/onboarding/route");
const { POST: REFRESH } =
  await import("@/app/api/payment/onboarding/refresh/route");
const { POST: STEP_UP } = await import("@/app/api/auth/mfa/step-up/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const post = (path: string, body?: unknown) =>
  new NextRequest(new URL(path, "http://localhost"), {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("BFF do onboarding Stripe (payment-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = {
      access_token: "login-token",
      profile_access_token: "seller-profile-token",
    };
    fetchMock = vi.fn().mockResolvedValue(json({ message: "", data: {} }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lê a situação da conta com o token do perfil", async () => {
    await ACCESS(new NextRequest(new URL("http://localhost/x")), {
      params: Promise.resolve({ organizationId: ORGANIZATION }),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/payment/api/v2/payment/access/${ORGANIZATION}`,
    );
    expect(init.headers.Authorization).toBe("Bearer seller-profile-token");
  });

  it("recusa organizationId inválido sem chamar a payment-api", async () => {
    const response = await ACCESS(
      new NextRequest(new URL("http://localhost/x")),
      { params: Promise.resolve({ organizationId: "x" }) },
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("inicia o onboarding só com o e-mail", async () => {
    await ONBOARDING(
      post("/api/payment/onboarding", {
        email: " dono@fibra.com.br ",
        organizationId: "outra",
      }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://upstream.test/payment/api/v2/payment/onboarding");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "dono@fibra.com.br" });
  });

  it("sem e-mail, responde 422 sem chamar a payment-api", async () => {
    const response = await ONBOARDING(post("/api/payment/onboarding", {}));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("token vencido (403 'Invalid token') vira 401; mfa_required segue 403", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ message: "Invalid token: 401: Token expired", data: null }, 403),
    );
    expect((await REFRESH()).status).toBe(401);

    fetchMock.mockResolvedValueOnce(
      json(
        {
          message: "Multi-factor authentication is required",
          data: null,
          code: "mfa_required",
        },
        403,
      ),
    );
    expect((await REFRESH()).status).toBe(403);
  });
});

describe("BFF do step-up do MFA (/api/auth/mfa/step-up)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const PAIR = {
    message: "",
    data: {
      access_token: "elevated-access",
      refresh_token: "elevated-refresh",
      token_type: "bearer",
      expires_in: 900,
      mfa: true,
      profile: "seller",
      context_version: 1,
    },
  };

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(json(PAIR));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("eleva a sessão de perfil e guarda o par nos cookies do perfil", async () => {
    jar = {
      access_token: "login-token",
      profile_access_token: "seller-profile-token",
    };
    const response = await STEP_UP(
      post("/api/auth/mfa/step-up", { totp_code: "482915" }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://upstream.test/identity/api/v1/auth/mfa/step-up");
    expect(init.headers.Authorization).toBe("Bearer seller-profile-token");
    expect(JSON.parse(init.body)).toEqual({ totp_code: "482915" });

    expect(response.status).toBe(200);
    const body = await response.json();
    // Os tokens não vão para o browser.
    expect(JSON.stringify(body)).not.toContain("elevated");
    expect(response.cookies.get("profile_access_token")?.value).toBe(
      "elevated-access",
    );
    expect(response.cookies.get("access_token")).toBeUndefined();
  });

  it("sem perfil, eleva a sessão do login", async () => {
    jar = { access_token: "login-token" };
    fetchMock.mockResolvedValueOnce(
      json({ ...PAIR, data: { ...PAIR.data, profile: null } }),
    );
    const response = await STEP_UP(
      post("/api/auth/mfa/step-up", { totp_code: "482915" }),
    );

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer login-token",
    );
    expect(response.cookies.get("access_token")?.value).toBe("elevated-access");
  });

  it("código errado repassa o 401 sem mexer nos cookies", async () => {
    jar = { access_token: "login-token" };
    fetchMock.mockResolvedValueOnce(
      json(
        {
          message: "Invalid MFA code",
          data: null,
          metadata: { code: "INVALID_MFA_CODE" },
        },
        401,
      ),
    );
    const response = await STEP_UP(
      post("/api/auth/mfa/step-up", { totp_code: "000000" }),
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("access_token")).toBeUndefined();
  });

  it("código fora do formato responde 422 sem chamar a identity-api", async () => {
    jar = { access_token: "login-token" };
    const response = await STEP_UP(
      post("/api/auth/mfa/step-up", { totp_code: "12ab" }),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
