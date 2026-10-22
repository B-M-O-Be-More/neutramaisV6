import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Sessão aberta no browser: o aceite NÃO pode levar este Bearer.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "session-token" } : undefined,
  }),
}));

process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const accept = await import("@/app/api/invites/accept/route");
const redeem = await import("@/app/api/invites/redeem/route");
const start = await import("@/app/api/auth/mfa/enrollment/start/route");
const confirm = await import("@/app/api/auth/mfa/enrollment/confirm/route");

const TOKEN = "Xy3_k-9QpLm2vNb8RtZaWc4dEfGh1JkL0oPqRsTuVwY";

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function upstream(status: number, data: unknown) {
  return {
    ok: status < 400,
    status,
    text: async () =>
      JSON.stringify({ message: "", data, errors: null, metadata: null }),
    headers: { get: () => "application/json" },
  };
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: init.body ? JSON.parse(init.body as string) : undefined,
  };
}

describe("BFF do aceite de convite", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("aceite: sem Bearer da sessão, só os campos do contrato, tokens viram cookies", async () => {
    fetchMock.mockResolvedValue(
      upstream(200, {
        next_step: "home",
        role: "buyer_member",
        access_token: "acc",
        refresh_token: "ref",
      }),
    );

    const response = await accept.POST(
      post("/api/invites/accept", {
        token: TOKEN,
        display_name: "Ana",
        phone: "+5585999999999",
        password: "SenhaForte#2026",
        type: "platform",
        role: "super_admin",
      }),
    );

    const call = lastCall(fetchMock);
    expect(call.url).toBe(
      "https://upstream.test/identity/api/v1/invites/accept",
    );
    expect(call.headers).not.toHaveProperty("Authorization");
    expect(call.body).toEqual({
      token: TOKEN,
      display_name: "Ana",
      phone: "+5585999999999",
      password: "SenhaForte#2026",
    });

    const json = await response.json();
    expect(json.data).toEqual({ next_step: "home", role: "buyer_member" });
    expect(response.cookies.get("access_token")?.value).toBe("acc");
    expect(response.cookies.get("refresh_token")?.value).toBe("ref");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("redeem: o token sai do corpo para o path, com o Bearer da sessão", async () => {
    fetchMock.mockResolvedValue(upstream(200, { role: "buyer_member" }));

    await redeem.POST(post("/api/invites/redeem", { token: TOKEN }));

    const call = lastCall(fetchMock);
    expect(call.url).toBe(
      `https://upstream.test/identity/api/v1/invites/${TOKEN}/redeem`,
    );
    expect(call.headers.Authorization).toBe("Bearer session-token");
  });

  it("redeem: recusa token fora do formato sem chamar o upstream", async () => {
    const response = await redeem.POST(
      post("/api/invites/redeem", { token: "../admin" }),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("MFA do onboarding: o token de cadastro vira o Bearer e o start sai sem corpo", async () => {
    fetchMock.mockResolvedValue(upstream(200, { manual_key: "K" }));

    await start.POST(
      post("/api/auth/mfa/enrollment/start", {
        enrollment_token: "enroll-token",
      }),
    );

    const call = lastCall(fetchMock);
    expect(call.url).toBe(
      "https://upstream.test/identity/api/v1/auth/mfa/enrollment/start",
    );
    expect(call.headers.Authorization).toBe("Bearer enroll-token");
    expect(call.body).toBeUndefined();
  });

  it("MFA do onboarding: o confirm leva só o TOTP e grava a sessão", async () => {
    fetchMock.mockResolvedValue(
      upstream(200, { access_token: "acc", refresh_token: "ref" }),
    );

    const response = await confirm.POST(
      post("/api/auth/mfa/enrollment/confirm", {
        enrollment_token: "enroll-token",
        totp_code: "123456",
        rememberMe: false,
      }),
    );

    const call = lastCall(fetchMock);
    expect(call.headers.Authorization).toBe("Bearer enroll-token");
    expect(call.body).toEqual({ totp_code: "123456" });
    expect(response.cookies.get("access_token")?.value).toBe("acc");
  });
});
