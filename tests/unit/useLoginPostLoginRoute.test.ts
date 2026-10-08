import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLogin } from "@/hooks/useLogin";
import { authService, type MeProfile } from "@/services/auth.service";
import { NetworkError } from "@/services/errors";
import { kycService, type KycState } from "@/services/kyc.service";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
    mfaVerify: vi.fn(),
    mfaEnrollStart: vi.fn(),
    mfaEnrollConfirm: vi.fn(),
  },
}));

vi.mock("@/services/kyc.service", () => ({
  kycService: { getStatus: vi.fn() },
}));

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

const CREDENTIALS = {
  email: "seller@bmo.dev.br",
  password: "senha-atual",
  rememberMe: false,
};

function kycState(state: KycState) {
  vi.mocked(kycService.getStatus).mockResolvedValueOnce({
    kyc_state: state,
    kyc_level: "basic",
  });
}

describe("useLogin · destino depois do login", () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset().mockResolvedValue({
      mfa_required: false,
    });
    vi.mocked(authService.mfaVerify).mockReset().mockResolvedValue(null);
    vi.mocked(authService.me)
      .mockReset()
      .mockResolvedValue({ organization_id: ORG_ID } as MeProfile);
    vi.mocked(kycService.getStatus).mockReset();
    router.push.mockReset();
  });

  it.each<KycState>(["pending", "basic", "pending_documents"])(
    "leva para o KYC quando a organização ainda deve documentos (%s)",
    async (state) => {
      kycState(state);
      const { result } = renderHook(() => useLogin());

      await act(() => result.current.submitCredentials(CREDENTIALS));

      expect(kycService.getStatus).toHaveBeenCalledWith(ORG_ID);
      expect(router.push).toHaveBeenCalledWith("/kyc");
    },
  );

  it.each<KycState>(["under_review", "verified", "complete"])(
    "vai para o dashboard quando não há documento a enviar (%s)",
    async (state) => {
      kycState(state);
      const { result } = renderHook(() => useLogin());

      await act(() => result.current.submitCredentials(CREDENTIALS));

      expect(router.push).toHaveBeenCalledWith("/dashboard");
    },
  );

  it("vai para o dashboard se a consulta do KYC falhar", async () => {
    vi.mocked(kycService.getStatus).mockRejectedValueOnce(
      new NetworkError("offline"),
    );
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(router.push).toHaveBeenCalledWith("/dashboard");
    expect(result.current.formError).toBeUndefined();
  });

  it("aplica a mesma regra depois do desafio de MFA", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      mfa_required: true,
      mfa_challenge_token: "challenge",
    });
    kycState("pending");
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));
    expect(router.push).not.toHaveBeenCalled();

    await act(() => result.current.submitMfa({ totpCode: "123456" }));

    expect(router.push).toHaveBeenCalledWith("/kyc");
  });
});
