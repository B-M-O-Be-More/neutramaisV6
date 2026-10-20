import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar[name] ? { value: jar[name] } : undefined),
  }),
}));
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

describe("KYC upload BFF", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(["session", "registration", "none"])(
    "forwards authorization and confirmation with %s auth",
    async (mode) => {
      jar =
        mode === "session"
          ? { access_token: "session", email_confirm_token: "registration" }
          : mode === "registration"
            ? { email_confirm_token: "registration" }
            : {};
      const fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 201,
          text: async () => "{}",
          headers: { get: () => "application/json" },
        });
      vi.stubGlobal("fetch", fetch);
      const authorize =
        await import("@/app/api/organizations/[orgId]/kyc/uploads/route");
      const confirm =
        await import("@/app/api/organizations/[orgId]/kyc/uploads/[uploadId]/confirm/route");
      const body = {
        document_type: "bank_proof",
        kyc_level_supported: "verified",
        mime_type: "application/pdf",
        size_bytes: 10,
      };
      const req = (data: unknown) =>
        new NextRequest("http://localhost/api/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      await authorize.POST(req(body), {
        params: Promise.resolve({ orgId: "org-1" }),
      });
      await confirm.POST(req({}), {
        params: Promise.resolve({ orgId: "org-1", uploadId: "upload-1" }),
      });
      expect(fetch.mock.calls.map(([url]) => url)).toEqual([
        "https://upstream.test/identity/api/v1/organizations/org-1/kyc/uploads",
        "https://upstream.test/identity/api/v1/organizations/org-1/kyc/uploads/upload-1/confirm",
      ]);
      expect(fetch.mock.calls.map(([, init]) => JSON.parse(init.body))).toEqual(
        [body, {}],
      );
      for (const [, init] of fetch.mock.calls) {
        if (mode === "none")
          expect(init.headers).not.toHaveProperty("Authorization");
        else
          expect(init.headers.Authorization).toBe(
            `Bearer ${mode === "session" ? "session" : "registration"}`,
          );
      }
    },
  );
});
