import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as confirmPOST } from "@/app/api/auth/mfa/enroll/confirm/route";
import { POST as enrollPOST } from "@/app/api/auth/mfa/enroll/route";
import { setAuthCookies } from "@/server/authCookies";
import { callIdentity } from "@/server/identityProxy";

vi.mock("@/server/identityProxy", () => ({
  callIdentity: vi.fn(),
  envelopeError: vi.fn(),
}));

vi.mock("@/server/authCookies", () => ({
  setAuthCookies: vi.fn(),
}));

function jsonRequest(path: string, body: object) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function upstream(status: number, envelope: object) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: JSON.stringify(envelope),
    contentType: "application/json",
  };
}

const SETUP_ENVELOPE = {
  message: "ok",
  data: {
    otpauth_uri: "otpauth://totp/Neutra%2B:admin?secret=JBSWY3DPEHPK3PXP",
    manual_key: "JBSWY3DPEHPK3PXP",
    recovery_codes: ["aaaa-bbbb", "cccc-dddd"],
    enrollment_token: "confirm-credential",
    expires_in: 300,
  },
  errors: null,
  metadata: null,
};

describe("BFF POST /api/auth/mfa/enroll", () => {
  beforeEach(() => {
    vi.mocked(callIdentity)
      .mockReset()
      .mockResolvedValue(upstream(200, SETUP_ENVELOPE));
  });

  it("encaminha o corpo sem Authorization e responde no-store", async () => {
    const body = { enrollment_token: "start-credential", password: "senha" };

    const res = await enrollPOST(jsonRequest("/api/auth/mfa/enroll", body));

    expect(callIdentity).toHaveBeenCalledWith({
      method: "POST",
      path: "/auth/mfa/enroll",
      body,
      anonymous: true,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect((await res.json()).data.enrollment_token).toBe("confirm-credential");
  });

  it("repassa o erro do upstream com o status original", async () => {
    vi.mocked(callIdentity).mockResolvedValueOnce(
      upstream(401, {
        message: "invalid",
        data: null,
        errors: null,
        metadata: { code: "MFA_ENROLLMENT_TOKEN_INVALID" },
      }),
    );

    const res = await enrollPOST(
      jsonRequest("/api/auth/mfa/enroll", {
        enrollment_token: "x",
        password: "y",
      }),
    );

    expect(res.status).toBe(401);
    expect((await res.json()).metadata.code).toBe(
      "MFA_ENROLLMENT_TOKEN_INVALID",
    );
  });
});

describe("BFF POST /api/auth/mfa/enroll/confirm", () => {
  beforeEach(() => {
    vi.mocked(callIdentity)
      .mockReset()
      .mockResolvedValue(
        upstream(200, {
          message: "ok",
          data: {
            access_token: "a",
            refresh_token: "r",
            token_type: "Bearer",
            expires_in: 900,
          },
          errors: null,
          metadata: null,
        }),
      );
    vi.mocked(setAuthCookies).mockReset();
  });

  it("retira o rememberMe do corpo e chama sem Authorization", async () => {
    await confirmPOST(
      jsonRequest("/api/auth/mfa/enroll/confirm", {
        enrollment_token: "confirm-credential",
        totp_code: "012345",
        rememberMe: true,
      }),
    );

    expect(callIdentity).toHaveBeenCalledWith({
      method: "POST",
      path: "/auth/mfa/enroll/confirm",
      body: { enrollment_token: "confirm-credential", totp_code: "012345" },
      anonymous: true,
    });
  });

  it.each([true, false])(
    "em sucesso grava os cookies (rememberMe=%s) e tira os tokens do corpo",
    async (rememberMe) => {
      const res = await confirmPOST(
        jsonRequest("/api/auth/mfa/enroll/confirm", {
          enrollment_token: "confirm-credential",
          totp_code: "123456",
          rememberMe,
        }),
      );

      expect(setAuthCookies).toHaveBeenCalledWith(
        expect.anything(),
        { accessToken: "a", refreshToken: "r" },
        rememberMe,
      );
      const body = await res.json();
      expect(body.data).not.toHaveProperty("access_token");
      expect(body.data).not.toHaveProperty("refresh_token");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    },
  );

  it("INVALID_MFA_CODE: passthrough sem criar sessão", async () => {
    vi.mocked(callIdentity).mockResolvedValueOnce(
      upstream(401, {
        message: "invalid",
        data: null,
        errors: null,
        metadata: { code: "INVALID_MFA_CODE" },
      }),
    );

    const res = await confirmPOST(
      jsonRequest("/api/auth/mfa/enroll/confirm", {
        enrollment_token: "confirm-credential",
        totp_code: "000000",
      }),
    );

    expect(res.status).toBe(401);
    expect(setAuthCookies).not.toHaveBeenCalled();
  });
});
