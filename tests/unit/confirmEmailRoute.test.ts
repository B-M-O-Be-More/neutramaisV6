import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` explode fora de um Server Component; o identityProxy o importa.
vi.mock("server-only", () => ({}));

const callIdentity = vi.fn();
vi.mock("@/server/identityProxy", async () => {
  const actual = await vi.importActual<typeof import("@/server/identityProxy")>(
    "@/server/identityProxy",
  );
  return { ...actual, callIdentity };
});

// `cookies()` do next/headers só existe em request scope.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const { GET } = await import("@/app/api/auth/confirm-email/route");

const TOKEN = "OhDmalA75QBiUyCdpxPuhtkEgzTCsyyLr4XYBHEdGAA.2580fc67";
const USER_ID = "019fee5d-e152-7380-9fc0-800f08cf6d7e";

function request(): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/auth/confirm-email?token=${TOKEN}&user_id=${USER_ID}`,
  );
}

/** Mapa cookie → { value, maxAge } a partir dos Set-Cookie da resposta. */
function cookiesOf(response: Response) {
  return Object.fromEntries(
    response.headers
      .getSetCookie()
      .map((header) => {
        const [pair, ...attributes] = header.split(";");
        const [name, value] = pair.split("=");
        const maxAge = attributes
          .map((a) => a.trim())
          .find((a) => a.toLowerCase().startsWith("max-age="))
          ?.split("=")[1];
        return [name, { value, maxAge }] as const;
      })
      .filter(([name]) => name),
  );
}

describe("GET /api/auth/confirm-email", () => {
  beforeEach(() => callIdentity.mockReset());

  it("em 200, derruba a sessão antiga e grava token + user_id do link", async () => {
    callIdentity.mockResolvedValue({
      ok: true,
      status: 200,
      text: JSON.stringify({ message: "ok", data: null, errors: null }),
      contentType: "application/json",
    });

    const response = await GET(request());
    const cookies = cookiesOf(response);

    expect(response.status).toBe(200);

    // Sessão anterior zerada — o link costuma abrir num navegador já logado.
    expect(cookies.access_token).toEqual({ value: "", maxAge: "0" });
    expect(cookies.refresh_token).toEqual({ value: "", maxAge: "0" });
    expect(cookies.session_remember).toEqual({ value: "", maxAge: "0" });

    // Contexto novo no lugar.
    expect(cookies.email_confirm_token.value).toBe(TOKEN);
    expect(cookies.email_confirm_user.value).toBe(USER_ID);
    expect(Number(cookies.email_confirm_token.maxAge)).toBeGreaterThan(0);
  });

  it("vira sessão de fato quando o upstream devolve o par de tokens", async () => {
    callIdentity.mockResolvedValue({
      ok: true,
      status: 200,
      text: JSON.stringify({
        message: "ok",
        data: {
          access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz",
          refresh_token: "refresh-abc",
          email_confirmed: true,
        },
        errors: null,
      }),
      contentType: "application/json",
    });

    const response = await GET(request());
    const cookies = cookiesOf(response);

    // Os tokens viram cookie httpOnly — é o que dá Bearer ao /kyc/artifacts.
    expect(cookies.access_token.value).toBe(
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz",
    );
    expect(cookies.refresh_token.value).toBe("refresh-abc");

    // ...e somem do corpo devolvido ao browser (ADR-002).
    const body = await response.json();
    expect(body.data).toEqual({ email_confirmed: true });
  });

  it("em erro do upstream, limpa tudo e não grava contexto novo", async () => {
    callIdentity.mockResolvedValue({
      ok: false,
      status: 422,
      text: JSON.stringify({
        message: "Token invalid or expired: token_already_used_or_invalid",
        data: null,
        errors: null,
      }),
      contentType: "application/json",
    });

    const response = await GET(request());
    const cookies = cookiesOf(response);

    // Status e corpo do upstream passam verbatim.
    expect(response.status).toBe(422);
    expect(await response.text()).toContain("token_already_used_or_invalid");

    expect(cookies.access_token).toEqual({ value: "", maxAge: "0" });
    expect(cookies.email_confirm_token).toEqual({ value: "", maxAge: "0" });
    expect(cookies.email_confirm_user).toEqual({ value: "", maxAge: "0" });
  });
});
