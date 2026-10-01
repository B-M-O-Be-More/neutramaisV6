import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLogin } from "@/hooks/useLogin";
import { authService } from "@/services/auth.service";
import { NetworkError, apiErrorFromResponse } from "@/services/errors";

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
    mfaVerify: vi.fn(),
    mfaEnrollStart: vi.fn(),
    mfaEnrollConfirm: vi.fn(),
  },
}));

type LoginData = Awaited<ReturnType<typeof authService.login>>;
type SetupData = Awaited<ReturnType<typeof authService.mfaEnrollStart>>;

const CREDENTIALS = {
  email: "admin@bmo.dev.br",
  password: "senha-atual",
  rememberMe: true,
};

// Resposta do login para Admin/Seller com MFA obrigatório ainda não cadastrado.
const ENROLLMENT_LOGIN: LoginData = {
  mfa_required: true,
  mfa_enrollment_required: true,
  mfa_enrollment_token: "start-credential",
  mfa_challenge_token: null,
  expires_in: 300,
};

function setupData(overrides: Partial<SetupData> = {}): SetupData {
  return {
    otpauth_uri: "otpauth://totp/Neutra%2B:admin?secret=JBSWY3DPEHPK3PXP",
    manual_key: "JBSWY3DPEHPK3PXP",
    recovery_codes: ["aaaa-1111", "bbbb-2222", "cccc-3333"],
    enrollment_token: "confirm-credential",
    expires_in: 300,
    ...overrides,
  };
}

function upstreamError(status: number, code: string) {
  const envelope = {
    message: code,
    data: null,
    errors: null,
    metadata: { code },
  };
  return apiErrorFromResponse(status, [], envelope.message, envelope);
}

/** Login → etapa de cadastro, já com os segredos na tela do QR code. */
async function renderInSetup() {
  vi.mocked(authService.login).mockResolvedValueOnce(ENROLLMENT_LOGIN);
  vi.mocked(authService.mfaEnrollStart).mockResolvedValueOnce(setupData());

  const hook = renderHook(() => useLogin());
  await act(() => hook.result.current.submitCredentials(CREDENTIALS));
  await act(() => hook.result.current.enrollment.startSetup());
  return hook;
}

/** Avança do QR code até a validação do TOTP, confirmando os códigos. */
async function renderInTotp() {
  const hook = await renderInSetup();
  act(() => hook.result.current.enrollment.goTo("recoveryCodes"));
  act(() => hook.result.current.enrollment.setRecoveryCodesSaved(true));
  act(() => hook.result.current.enrollment.goTo("totp"));
  return hook;
}

describe("useLogin · cadastro de MFA do primeiro login", () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset();
    vi.mocked(authService.mfaEnrollStart).mockReset();
    vi.mocked(authService.mfaEnrollConfirm).mockReset();
    router.push.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("mfa_enrollment_required tem prioridade sobre mfa_required", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(ENROLLMENT_LOGIN);
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(result.current.step).toBe("mfaEnrollment");
    expect(result.current.enrollment.phase).toBe("intro");
    expect(result.current.enrollment.secondsLeft).toBe(300);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("sem cadastro pendente, mfa_required continua abrindo o desafio", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      mfa_required: true,
      mfa_challenge_token: "challenge",
    });
    const { result } = renderHook(() => useLogin());

    await act(() => result.current.submitCredentials(CREDENTIALS));

    expect(result.current.step).toBe("mfa");
  });

  it("troca credencial de início + senha pelos segredos e usa a nova credencial no confirm", async () => {
    const { result } = await renderInSetup();

    expect(authService.mfaEnrollStart).toHaveBeenCalledWith({
      enrollment_token: "start-credential",
      password: "senha-atual",
    });
    expect(result.current.enrollment.phase).toBe("qrCode");
    expect(result.current.enrollment.secrets).toEqual({
      otpauthUri: "otpauth://totp/Neutra%2B:admin?secret=JBSWY3DPEHPK3PXP",
      manualKey: "JBSWY3DPEHPK3PXP",
      recoveryCodes: ["aaaa-1111", "bbbb-2222", "cccc-3333"],
    });

    act(() => result.current.enrollment.goTo("recoveryCodes"));
    act(() => result.current.enrollment.setRecoveryCodesSaved(true));
    act(() => result.current.enrollment.goTo("totp"));
    expect(result.current.enrollment.phase).toBe("totp");

    vi.mocked(authService.mfaEnrollConfirm).mockResolvedValueOnce(null);
    await act(() => result.current.enrollment.confirm("012345"));

    // String preservada (zero à esquerda) e rememberMe do login.
    expect(authService.mfaEnrollConfirm).toHaveBeenCalledWith({
      enrollment_token: "confirm-credential",
      totp_code: "012345",
      rememberMe: true,
    });
    expect(result.current.enrollment.secrets).toBeNull();
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("não abre a validação sem a confirmação de que os códigos foram guardados", async () => {
    const { result } = await renderInSetup();
    act(() => result.current.enrollment.goTo("recoveryCodes"));

    act(() => result.current.enrollment.goTo("totp"));
    expect(result.current.enrollment.phase).toBe("recoveryCodes");

    // A confirmação sobrevive à ida e volta entre as telas.
    act(() => result.current.enrollment.setRecoveryCodesSaved(true));
    act(() => result.current.enrollment.goTo("qrCode"));
    act(() => result.current.enrollment.goTo("recoveryCodes"));
    expect(result.current.enrollment.recoveryCodesSaved).toBe(true);
  });

  it("a credencial de início e a senha são de uso único: não há reenvio", async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(ENROLLMENT_LOGIN);
    vi.mocked(authService.mfaEnrollStart).mockRejectedValueOnce(
      new NetworkError("offline"),
    );
    const { result } = renderHook(() => useLogin());
    await act(() => result.current.submitCredentials(CREDENTIALS));

    await act(() => result.current.enrollment.startSetup());

    // Resposta perdida no início: tela de falha em vez de reenviar às cegas.
    expect(authService.mfaEnrollStart).toHaveBeenCalledTimes(1);
    expect(result.current.enrollment.phase).toBe("failed");
    expect(result.current.enrollment.failure).toBe("error");

    await act(() => result.current.enrollment.startSetup());
    expect(authService.mfaEnrollStart).toHaveBeenCalledTimes(1);
  });

  it("previne envio duplicado da confirmação", async () => {
    const { result } = await renderInTotp();
    let resolveConfirm: (value: null) => void = () => {};
    vi.mocked(authService.mfaEnrollConfirm).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );

    await act(async () => {
      const first = result.current.enrollment.confirm("123456");
      void result.current.enrollment.confirm("123456");
      resolveConfirm(null);
      await first;
    });

    expect(authService.mfaEnrollConfirm).toHaveBeenCalledTimes(1);
  });

  it("401 INVALID_MFA_CODE: permanece na tela e repete com a mesma credencial", async () => {
    const { result } = await renderInTotp();
    vi.mocked(authService.mfaEnrollConfirm)
      .mockRejectedValueOnce(upstreamError(401, "INVALID_MFA_CODE"))
      .mockResolvedValueOnce(null);

    await act(() => result.current.enrollment.confirm("999999"));

    expect(result.current.step).toBe("mfaEnrollment");
    expect(result.current.enrollment.phase).toBe("totp");
    expect(result.current.enrollment.formError).toBe(
      "MfaEnrollment.errors.invalidCode",
    );

    await act(() => result.current.enrollment.confirm("123456"));

    expect(authService.mfaEnrollConfirm).toHaveBeenLastCalledWith(
      expect.objectContaining({ enrollment_token: "confirm-credential" }),
    );
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("422: permanece na tela (validação não consome a credencial)", async () => {
    const { result } = await renderInTotp();
    vi.mocked(authService.mfaEnrollConfirm).mockRejectedValueOnce(
      apiErrorFromResponse(422, [
        { field: "totp_code", code: "value_error", detail: "6 dígitos" },
      ]),
    );

    await act(() => result.current.enrollment.confirm("12345"));

    expect(result.current.enrollment.phase).toBe("totp");
    expect(result.current.enrollment.formError).toBe("6 dígitos");
  });

  it.each([
    [401, "MFA_ENROLLMENT_TOKEN_INVALID", "timeout"],
    [409, "MFA_ALREADY_ENROLLED", "error"],
    [429, "MFA_RATE_LIMIT_EXCEEDED", "rateLimit"],
    [503, "MFA_UNAVAILABLE", "error"],
  ])(
    "HTTP %i %s no confirm: descarta os segredos e mostra a tela %s",
    async (status, code, failure) => {
      const { result } = await renderInTotp();
      vi.mocked(authService.mfaEnrollConfirm).mockRejectedValueOnce(
        upstreamError(status, code),
      );

      await act(() => result.current.enrollment.confirm("123456"));

      expect(result.current.step).toBe("mfaEnrollment");
      expect(result.current.enrollment.phase).toBe("failed");
      expect(result.current.enrollment.failure).toBe(failure);
      expect(result.current.enrollment.secrets).toBeNull();
      expect(router.push).not.toHaveBeenCalled();
    },
  );

  it("429: estima a liberação a partir da janela de 300 s", async () => {
    vi.useFakeTimers();
    const { result } = await renderInTotp();
    vi.mocked(authService.mfaEnrollConfirm).mockRejectedValueOnce(
      upstreamError(429, "MFA_RATE_LIMIT_EXCEEDED"),
    );

    await act(() => result.current.enrollment.confirm("123456"));
    expect(result.current.enrollment.retryInSeconds).toBe(300);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.enrollment.retryInSeconds).toBe(240);
    expect(result.current.enrollment.phase).toBe("failed");
  });

  it("401 INVALID_CREDENTIALS: volta direto ao login com a explicação", async () => {
    const { result } = await renderInTotp();
    vi.mocked(authService.mfaEnrollConfirm).mockRejectedValueOnce(
      upstreamError(401, "INVALID_CREDENTIALS"),
    );

    await act(() => result.current.enrollment.confirm("123456"));

    expect(result.current.step).toBe("credentials");
    expect(result.current.formError).toBe(
      "MfaEnrollment.errors.invalidCredentials",
    );
    expect(result.current.enrollment.secrets).toBeNull();
  });

  it("resposta de confirmação perdida: tela de erro e novo login descobre o estado", async () => {
    const { result } = await renderInTotp();
    vi.mocked(authService.mfaEnrollConfirm).mockRejectedValueOnce(
      new NetworkError("connection reset"),
    );

    await act(() => result.current.enrollment.confirm("123456"));

    expect(result.current.enrollment.failure).toBe("error");

    act(() => result.current.enrollment.backToLogin());
    expect(result.current.step).toBe("credentials");
    expect(result.current.formError).toBeUndefined();

    // O novo login já encontra o autenticador ativo → desafio normal.
    vi.mocked(authService.login).mockResolvedValueOnce({
      mfa_required: true,
      mfa_challenge_token: "challenge",
    });
    await act(() => result.current.submitCredentials(CREDENTIALS));
    expect(result.current.step).toBe("mfa");
  });

  it("expira localmente quando o prazo da etapa acaba", async () => {
    vi.useFakeTimers();
    const { result } = await renderInSetup();
    expect(result.current.enrollment.secondsLeft).toBe(300);

    await act(async () => {
      vi.advanceTimersByTime(299_000);
    });
    expect(result.current.enrollment.phase).toBe("qrCode");
    expect(result.current.enrollment.secondsLeft).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.enrollment.phase).toBe("failed");
    expect(result.current.enrollment.failure).toBe("timeout");
    expect(result.current.enrollment.secrets).toBeNull();
  });

  it("voltar ao login limpa os segredos e volta às credenciais sem mensagem", async () => {
    const { result } = await renderInSetup();

    act(() => result.current.enrollment.backToLogin());

    expect(result.current.step).toBe("credentials");
    expect(result.current.formError).toBeUndefined();
    expect(result.current.enrollment.secrets).toBeNull();
  });

  it("novo login substitui o cadastro pendente: segredos antigos não são reaproveitados", async () => {
    const { result } = await renderInSetup();
    act(() => result.current.enrollment.backToLogin());

    vi.mocked(authService.login).mockResolvedValueOnce({
      ...ENROLLMENT_LOGIN,
      mfa_enrollment_token: "start-credential-2",
    });
    vi.mocked(authService.mfaEnrollStart).mockResolvedValueOnce(
      setupData({
        manual_key: "NEWKEYNEWKEYNEWK",
        enrollment_token: "confirm-credential-2",
      }),
    );
    await act(() => result.current.submitCredentials(CREDENTIALS));
    expect(result.current.enrollment.secrets).toBeNull();
    expect(result.current.enrollment.recoveryCodesSaved).toBe(false);

    await act(() => result.current.enrollment.startSetup());
    expect(authService.mfaEnrollStart).toHaveBeenLastCalledWith({
      enrollment_token: "start-credential-2",
      password: "senha-atual",
    });
    expect(result.current.enrollment.secrets?.manualKey).toBe(
      "NEWKEYNEWKEYNEWK",
    );
  });
});
