import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLogin } from "@/hooks/useLogin";
import {
  authService,
  type MeOrganization,
  type MeProfile,
} from "@/services/auth.service";
import { NetworkError } from "@/services/errors";

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

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

const CREDENTIALS = {
  email: "seller@bmo.dev.br",
  password: "senha-atual",
  rememberMe: false,
};

function meWith(
  organization: Omit<MeOrganization, "id">,
  roles: string[] = ["seller_owner"],
) {
  vi.mocked(authService.me).mockResolvedValueOnce({
    roles,
    organization: { id: ORG_ID, ...organization },
  } as MeProfile);
}

describe("useLogin · destino depois do login", () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset().mockResolvedValue({
      mfa_required: false,
    });
    vi.mocked(authService.mfaVerify).mockReset().mockResolvedValue(null);
    vi.mocked(authService.me).mockReset();
    router.push.mockReset();
  });

  // Cenários do Seller lidos de `organization` no /me.
  it.each<[string, Omit<MeOrganization, "id">]>([
    [
      "ainda não enviou documentos",
      { status: "pending", kyc_state: "pending", kyc_level: "pending" },
    ],
    [
      "em análise",
      { status: "pending", kyc_state: "basic", kyc_level: "basic" },
    ],
    [
      "admin pediu mais documentos",
      { status: "pending", kyc_state: "pending_documents", kyc_level: "basic" },
    ],
    [
      "recusada",
      { status: "pending", kyc_state: "rejected", kyc_level: "basic" },
    ],
  ])("leva para o KYC quando %s", async (_, organization) => {
    meWith(organization);
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(router.push).toHaveBeenCalledWith("/kyc");
  });

  it.each<[string, Omit<MeOrganization, "id">]>([
    [
      "aprovada",
      { status: "active", kyc_state: "verified", kyc_level: "verified" },
    ],
    [
      "com KYC completo",
      { status: "active", kyc_state: "complete", kyc_level: "complete" },
    ],
  ])("vai para o dashboard quando a organização está %s", async (_, org) => {
    meWith(org);
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it.each(["admin_neutra", "super_admin"])(
    "leva o %s ao painel administrativo, mesmo com KYC pendente",
    async (role) => {
      meWith(
        { status: "pending", kyc_state: "pending", kyc_level: "pending" },
        [role],
      );
      const { result } = renderHook(() => useLogin());

      await act(() => result.current.submitCredentials(CREDENTIALS));

      expect(router.push).toHaveBeenCalledWith("/admin");
    },
  );

  it("vai para o dashboard se o /me falhar", async () => {
    vi.mocked(authService.me).mockRejectedValueOnce(
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
    meWith({ status: "pending", kyc_state: "pending", kyc_level: "pending" });
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));
    expect(router.push).not.toHaveBeenCalled();

    await act(() => result.current.submitMfa({ totpCode: "123456" }));

    expect(router.push).toHaveBeenCalledWith("/kyc");
  });
});
