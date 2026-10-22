import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAcceptInvite } from "@/hooks/useAcceptInvite";
import { authService } from "@/services/auth.service";
import { apiErrorFromResponse } from "@/services/errors";
import { invitesService } from "@/services/invites.service";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/services/invites.service", () => ({
  invitesService: { accept: vi.fn(), redeem: vi.fn() },
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    me: vi.fn(),
    mfaEnrollmentStart: vi.fn(),
    mfaEnrollmentConfirm: vi.fn(),
    mfaEnrollStart: vi.fn(),
    mfaEnrollConfirm: vi.fn(),
  },
}));

const TOKEN = "Xy3_k-9QpLm2vNb8RtZaWc4dEfGh1JkL0oPqRsTuVwY";
const INPUT = {
  displayName: "Ana",
  phone: "+5585999999999",
  password: "SenhaForte#2026",
};

describe("useAcceptInvite", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", `/accept/#token=${TOKEN}`);
    router.push.mockReset();
    vi.mocked(authService.me).mockRejectedValue(new Error("sem /me"));
  });

  afterEach(() => vi.clearAllMocks());

  it("conta existente: depois do login, resgata o convite com o token em memória", async () => {
    vi.mocked(invitesService.accept).mockRejectedValueOnce(
      apiErrorFromResponse(409),
    );
    vi.mocked(invitesService.redeem).mockResolvedValueOnce({
      membership_id: "m-1",
      organization_id: "o-1",
      role: "buyer_member",
    });

    const { result } = renderHook(() => useAcceptInvite());

    await act(() => result.current.submit(INPUT));
    expect(result.current.status).toBe("existingAccount");

    act(() => result.current.startLogin());
    expect(result.current.status).toBe("login");

    await act(() => result.current.redeem());

    expect(invitesService.redeem).toHaveBeenCalledWith(TOKEN);
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("resgate recusado por já pertencer a outra organização (409)", async () => {
    vi.mocked(invitesService.redeem).mockRejectedValueOnce(
      apiErrorFromResponse(409),
    );
    const { result } = renderHook(() => useAcceptInvite());

    await act(() => result.current.redeem());

    expect(result.current.status).toBe("redeemConflict");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("MFA do onboarding: start e confirm usam o mesmo token do aceite, sem senha", async () => {
    vi.mocked(invitesService.accept).mockResolvedValueOnce({
      next_step: "mfa_enrollment",
      user_id: "u-1",
      organization_id: "o-1",
      membership_id: "m-1",
      role: "seller_finance",
      mfa_enrollment_required: true,
      mfa_enrollment_token: "enroll-token",
      mfa_enrollment_expires_in: 600,
      mfa_enrollment_link_sent: false,
    });
    vi.mocked(authService.mfaEnrollmentStart).mockResolvedValueOnce({
      otpauth_uri: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP",
      manual_key: "JBSWY3DPEHPK3PXP",
      recovery_codes: ["aaaa-1111"],
      expires_in: 590,
    });
    vi.mocked(authService.mfaEnrollmentConfirm).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAcceptInvite());

    await act(() => result.current.submit(INPUT));
    expect(result.current.status).toBe("mfaEnrollment");

    await act(() => result.current.enrollment.startSetup());
    expect(authService.mfaEnrollmentStart).toHaveBeenCalledWith("enroll-token");
    expect(authService.mfaEnrollStart).not.toHaveBeenCalled();

    act(() => result.current.enrollment.setRecoveryCodesSaved(true));
    act(() => result.current.enrollment.goTo("totp"));
    await act(() => result.current.enrollment.confirm("123456"));

    expect(authService.mfaEnrollmentConfirm).toHaveBeenCalledWith({
      enrollment_token: "enroll-token",
      totp_code: "123456",
      rememberMe: false,
    });
    expect(authService.mfaEnrollConfirm).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("indisponível (503) mantém o formulário para tentar de novo", async () => {
    vi.mocked(invitesService.accept).mockRejectedValueOnce(
      apiErrorFromResponse(503),
    );
    const { result } = renderHook(() => useAcceptInvite());

    await act(() => result.current.submit(INPUT));

    expect(result.current.status).toBe("form");
    expect(result.current.formError).toBe("PlatformInvite.errors.unavailable");
  });
});
