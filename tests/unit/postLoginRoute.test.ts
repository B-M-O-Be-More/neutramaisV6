import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePostLoginRoute } from "@/functions/postLoginRoute";
import { readRegisterHandoff } from "@/functions/registerHandoff";
import { authService, type MeProfile } from "@/services/auth.service";
import { RateLimitError } from "@/services/errors";

vi.mock("@/services/auth.service", () => ({
  authService: { me: vi.fn(), resendEmailConfirmation: vi.fn() },
}));

const USER_ID = "019fee5d-e152-7380-9fc0-800f08cf6d7e";
const ORG_ID = "019fee5d-e14f-7c21-a1b2-3c4d5e6f7a8b";
const VERIFY_STEP = 4;

function profile(overrides: Partial<MeProfile> = {}): MeProfile {
  return {
    id: USER_ID,
    organization: {
      id: ORG_ID,
      organization_type: "buyer",
      status: "active",
      kyc_level: "basic",
      kyc_state: "verified",
    },
    organization_id: ORG_ID,
    display_name: "Ana",
    email: "ana@empresa.com",
    phone: "+5511999990000",
    email_confirmed: true,
    phone_confirmed: false,
    status: "active",
    created_at: "2026-11-01T10:00:00Z",
    last_login_at: null,
    roles: ["buyer_owner"],
    permissions: [],
    mfa: false,
    ...overrides,
  } as MeProfile;
}

describe("resolvePostLoginRoute — conta pré-cadastrada", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authService.me).mockReset();
    vi.mocked(authService.resendEmailConfirmation).mockReset();
  });

  it("e-mail não confirmado: reenvia o link e volta para a Verificação", async () => {
    vi.mocked(authService.me).mockResolvedValue(
      profile({ email_confirmed: false }),
    );
    vi.mocked(authService.resendEmailConfirmation).mockResolvedValue(null);

    await expect(resolvePostLoginRoute()).resolves.toBe(
      "/register?resume=verify",
    );
    expect(authService.resendEmailConfirmation).toHaveBeenCalledWith(USER_ID);
    expect(readRegisterHandoff()).toMatchObject({
      organizationId: ORG_ID,
      email: "ana@empresa.com",
      phone: "+5511999990000",
      step: VERIFY_STEP,
      emailConfirmed: false,
      userId: USER_ID,
    });
  });

  it("falha no reenvio não impede a Verificação", async () => {
    vi.mocked(authService.me).mockResolvedValue(
      profile({ email_confirmed: false }),
    );
    vi.mocked(authService.resendEmailConfirmation).mockRejectedValue(
      new RateLimitError(429),
    );

    await expect(resolvePostLoginRoute()).resolves.toBe(
      "/register?resume=verify",
    );
  });

  it("e-mail confirmado segue o destino de sempre, sem reenvio", async () => {
    vi.mocked(authService.me).mockResolvedValue(profile());

    await expect(resolvePostLoginRoute()).resolves.toBe("/dashboard");
    expect(authService.resendEmailConfirmation).not.toHaveBeenCalled();
    expect(readRegisterHandoff()).toBeNull();
  });
});
