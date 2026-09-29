import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLogin } from "@/hooks/useLogin";
import { authService } from "@/services/auth.service";
import { apiErrorFromResponse } from "@/services/errors";

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

vi.mock("@/services/auth.service", () => ({
  authService: { login: vi.fn(), mfaVerify: vi.fn() },
}));

const CREDENTIALS = {
  email: "joao@bmo.dev.br",
  password: "senha-errada",
  rememberMe: false,
};

// Resposta real da identity-api quando o IP já acumulou 3 falhas e o
// `h-captcha-response` não foi enviado.
function captchaRequiredError(status = 400) {
  const envelope = {
    message: "CAPTCHA required. Please complete the challenge.",
    data: null,
    errors: null,
    metadata: { code: "CAPTCHA_REQUIRED" },
  };
  return apiErrorFromResponse(status, [], envelope.message, envelope);
}

describe("useLogin · CAPTCHA_REQUIRED", () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset();
  });

  it("não exige o desafio antes de qualquer resposta do upstream", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.captchaRequired).toBe(false);
  });

  it.each([400, 403, 429])(
    "exibe o desafio já na 1ª tentativa quando o upstream exige (HTTP %i)",
    async (status) => {
      // Simula o cenário pós-reload: contador local zerado, mas o IP já
      // bloqueado no servidor.
      vi.mocked(authService.login).mockRejectedValueOnce(
        captchaRequiredError(status),
      );
      const { result } = renderHook(() => useLogin());

      await act(() => result.current.submitCredentials(CREDENTIALS));

      expect(result.current.captchaRequired).toBe(true);
      expect(result.current.formError).toBe("Login.errors.captchaRequired");
    },
  );

  it("envia o token do hCaptcha no corpo e o rememberMe fora dele", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      mfa_required: false,
    } as Awaited<ReturnType<typeof authService.login>>);
    const { result } = renderHook(() => useLogin());

    await act(() =>
      result.current.submitCredentials({
        ...CREDENTIALS,
        rememberMe: true,
        captchaToken: "token-hcaptcha",
      }),
    );

    // Corpo exatamente no formato do LoginRequest da identity-api.
    expect(authService.login).toHaveBeenCalledWith(
      {
        email: CREDENTIALS.email,
        password: CREDENTIALS.password,
        "h-captcha-response": "token-hcaptcha",
      },
      true,
    );
  });

  it("não envia h-captcha-response enquanto o desafio não está ativo", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      mfa_required: false,
    } as Awaited<ReturnType<typeof authService.login>>);
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(authService.login).toHaveBeenCalledWith(
      { email: CREDENTIALS.email, password: CREDENTIALS.password },
      false,
    );
  });
});
