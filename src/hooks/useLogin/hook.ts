"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import { toaster } from "@/components/ui/toaster";
import { authService } from "@/services/auth.service";
import {
  AuthError,
  RateLimitError,
  ValidationError,
  upstreamDetailMessage,
  upstreamErrorCode,
} from "@/services/errors";

import type { CredentialsInput, LoginStep, MfaInput } from "./interface";

/**
 * A partir da 3ª tentativa falha o upstream passa a exigir `h-captcha-response`
 * (artefato: Auth & Tokens · /auth/login). Contamos no cliente para já renderizar
 * o widget antes de gastar uma tentativa que voltaria recusada.
 */
export const CAPTCHA_AFTER_FAILED_ATTEMPTS = 3;

// Destino pós-login. TODO: apontar para o dashboard quando ele existir.
const POST_LOGIN_ROUTE = "/";

/**
 * Orquestra o login (US-01) conforme o artefato da identity-api: credenciais →
 * (opcional) desafio de MFA → sessão estabelecida.
 *
 * Os tokens nunca chegam aqui: o BFF grava access_token/refresh_token em cookies
 * httpOnly (ADR-002) e devolve só o estado de MFA. Erros são tratados neste hook
 * (SDD §12.4), não nos componentes.
 */
export function useLogin() {
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = React.useState<LoginStep>("credentials");
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [formError, setFormError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Credencial do segundo fator + a escolha de "manter conectado" feita na etapa
  // anterior. Vivem só em memória: o challenge token é uma credencial de curta
  // duração e não deve ir para URL nem storage.
  const [challengeToken, setChallengeToken] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  const captchaRequired = failedAttempts >= CAPTCHA_AFTER_FAILED_ATTEMPTS;

  /** Erros comuns às duas etapas. Retorna true se tratou o erro. */
  const handleSharedError = React.useCallback(
    (error: unknown): boolean => {
      if (error instanceof RateLimitError) {
        toaster.create({ type: "error", title: t("Login.feedback.rateLimit") });
        return true;
      }
      if (error instanceof ValidationError) {
        // Nos 422 a identity-api responde `{"detail": [...]}` cru do FastAPI, então
        // `errors[]` vem vazio e a mensagem precisa vir do `detail`.
        setFormError(
          error.errors[0]?.detail ??
            upstreamDetailMessage(error) ??
            t("Login.feedback.error"),
        );
        return true;
      }
      return false;
    },
    [t],
  );

  const submitCredentials = React.useCallback(
    async ({
      email,
      password,
      rememberMe: remember,
      captchaToken,
    }: CredentialsInput) => {
      setFormError(undefined);
      setIsSubmitting(true);

      try {
        const data = await authService.login({
          email,
          password,
          rememberMe: remember,
          ...(captchaToken ? { "h-captcha-response": captchaToken } : {}),
        });

        // MFA habilitado: nenhum token foi emitido, seguimos para o desafio.
        if (data?.mfa_required) {
          setChallengeToken(data.mfa_challenge_token ?? "");
          setRememberMe(remember);
          setFailedAttempts(0);
          setStep("mfa");
          return;
        }

        // Sessão já estabelecida via cookies pelo BFF.
        setFailedAttempts(0);
        router.push(POST_LOGIN_ROUTE);
      } catch (error) {
        // Toda falha aqui consome uma tentativa no upstream — é o que move o
        // gatilho do CAPTCHA.
        setFailedAttempts((count) => count + 1);

        // Credenciais inválidas: ancoramos no código do upstream, não no status.
        // A identity-api responde INVALID_CREDENTIALS com HTTP 500 (não 401), então
        // checar apenas `AuthError` deixaria passar o caso mais comum do login.
        // Mensagem genérica de propósito: não revelamos se foi o e-mail ou a senha.
        if (
          error instanceof AuthError ||
          upstreamErrorCode(error) === "INVALID_CREDENTIALS"
        ) {
          setFormError(t("Login.errors.invalidCredentials"));
          return;
        }

        if (handleSharedError(error)) return;

        toaster.create({
          type: "error",
          title: t("Login.feedback.error"),
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleSharedError, router, t],
  );

  const submitMfa = React.useCallback(
    async ({ totpCode, recoveryCode }: MfaInput) => {
      setFormError(undefined);
      setIsSubmitting(true);

      try {
        await authService.mfaVerify({
          // O verify espera `challenge_token`, apesar de o login devolver o valor
          // como `mfa_challenge_token` — ver nota em auth.service.ts.
          challenge_token: challengeToken,
          // Exatamente um dos dois — enviar ambos é recusado pelo upstream.
          ...(totpCode
            ? { totp_code: totpCode }
            : { recovery_code: recoveryCode }),
          rememberMe,
        });

        router.push(POST_LOGIN_ROUTE);
      } catch (error) {
        const code = upstreamErrorCode(error);

        // Desafio expirado/inválido é diferente de código errado: o challenge
        // token morreu e digitar outro código não resolve. Voltamos às
        // credenciais para o usuário abrir um desafio novo.
        if (code === "MFA_CHALLENGE_INVALID") {
          setChallengeToken("");
          setStep("credentials");
          setFormError(t("Mfa.errors.challengeExpired"));
          return;
        }

        // INVALID_MFA_CODE cobre TOTP e recovery inválidos sem distinguir — a
        // mensagem exibida também não distingue.
        if (error instanceof AuthError || code === "INVALID_MFA_CODE") {
          setFormError(t("Mfa.errors.invalidCode"));
          return;
        }

        if (handleSharedError(error)) return;

        toaster.create({
          type: "error",
          title: t("Mfa.feedback.error"),
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [challengeToken, handleSharedError, rememberMe, router, t],
  );

  /** Abandona o desafio e volta às credenciais, descartando o challenge token. */
  const backToCredentials = React.useCallback(() => {
    setChallengeToken("");
    setFormError(undefined);
    setStep("credentials");
  }, []);

  return {
    step,
    formError,
    isSubmitting,
    captchaRequired,
    submitCredentials,
    submitMfa,
    backToCredentials,
  };
}
