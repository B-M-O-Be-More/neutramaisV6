import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/login/route";
import { setAuthCookies } from "@/server/authCookies";
import { callIdentity } from "@/server/identityProxy";

vi.mock("@/server/identityProxy", () => ({
  callIdentity: vi.fn(),
  envelopeError: vi.fn(),
}));

vi.mock("@/server/authCookies", () => ({
  setAuthCookies: vi.fn(),
}));

const TOKENS_ENVELOPE = JSON.stringify({
  message: "ok",
  data: { access_token: "a", refresh_token: "r", mfa_required: false },
  errors: null,
  metadata: null,
});

function loginRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("BFF POST /api/auth/login", () => {
  beforeEach(() => {
    vi.mocked(callIdentity).mockReset().mockResolvedValue({
      ok: true,
      status: 200,
      text: TOKENS_ENVELOPE,
      contentType: "application/json",
    });
    vi.mocked(setAuthCookies).mockReset();
  });

  it("repassa o corpo como veio, incluindo h-captcha-response", async () => {
    const body = {
      email: "joao@bmo.dev.br",
      password: "senha",
      "h-captcha-response": "token-hcaptcha",
    };

    await POST(loginRequest(body));

    expect(callIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/auth/login", body }),
    );
  });

  it.each([
    ["true", true],
    ["false", false],
  ])(
    "X-Remember-Me=%s define cookies persistentes = %s",
    async (header, persistent) => {
      await POST(
        loginRequest(
          { email: "joao@bmo.dev.br", password: "senha" },
          { "X-Remember-Me": header },
        ),
      );

      expect(setAuthCookies).toHaveBeenCalledWith(
        expect.anything(),
        { accessToken: "a", refreshToken: "r" },
        persistent,
      );
    },
  );

  it("sem o header, a sessão não é persistente", async () => {
    await POST(loginRequest({ email: "joao@bmo.dev.br", password: "senha" }));

    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      false,
    );
  });
});
