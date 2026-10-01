"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import { authService } from "@/services/auth.service";
import {
  RateLimitError,
  ValidationError,
  upstreamDetailMessage,
  upstreamErrorCode,
} from "@/services/errors";

import type {
  MfaEnrollmentFailure,
  MfaEnrollmentPhase,
  MfaEnrollmentSecrets,
  MfaEnrollmentSetupPhase,
  MfaEnrollmentStart,
  UseMfaEnrollmentOptions,
} from "./interface";

/**
 * Janela do limite de verificações do MFA (contrato: cinco tentativas a cada
 * 300 s, compartilhadas com o /mfa/verify). O backend não devolve quanto falta,
 * então a "liberação estimada" parte desta janela padrão.
 */
export const MFA_RATE_LIMIT_WINDOW_SECONDS = 300;

const SETUP_PHASES: readonly MfaEnrollmentPhase[] = [
  "qrCode",
  "recoveryCodes",
  "totp",
];

/** Como encerrar o cadastro diante de um erro terminal. */
type Outcome =
  | { type: "fail"; failure: MfaEnrollmentFailure }
  | { type: "restart"; messageKey: string };

/**
 * Destino de cada erro que invalida o cadastro em curso (contrato:
 * identity-api docs/FIRST-LOGIN-MFA.md).
 */
function outcomeFor(error: unknown): Outcome {
  switch (upstreamErrorCode(error)) {
    // Expirada, consumida, substituída por outro início ou conta inelegível.
    case "MFA_ENROLLMENT_TOKEN_INVALID":
      return { type: "fail", failure: "timeout" };
    case "MFA_RATE_LIMIT_EXCEEDED":
      return { type: "fail", failure: "rateLimit" };
    // Senha mudou no meio do caminho: o próprio formulário de login explica.
    case "INVALID_CREDENTIALS":
      return {
        type: "restart",
        messageKey: "MfaEnrollment.errors.invalidCredentials",
      };
  }

  if (error instanceof RateLimitError) {
    return { type: "fail", failure: "rateLimit" };
  }

  // 409 MFA_ALREADY_ENROLLED, 503 MFA_UNAVAILABLE, outros 5xx e resposta
  // perdida: não dá para saber se a confirmação persistiu. Refazer o login
  // descobre o estado atual — e, se persistiu, ele pedirá o código do app.
  return { type: "fail", failure: "error" };
}

/**
 * Cadastro de MFA obrigatório no primeiro login de Admin e Seller (NEU-479):
 * credencial de início (do login) + senha → segredos do autenticador +
 * credencial de confirmação → primeiro TOTP → sessão.
 *
 * Credenciais, senha e segredos vivem SÓ em memória (refs/estado deste hook):
 * nunca em URL, storage, logs ou analytics. Qualquer saída — sucesso,
 * cancelamento, expiração ou erro terminal — descarta tudo.
 *
 * Nenhuma API geral é chamada aqui e a navegação só é liberada depois que o
 * confirm devolve a sessão (gravada em cookies httpOnly pelo BFF).
 */
export function useMfaEnrollment({
  onRestart,
  onComplete,
}: UseMfaEnrollmentOptions) {
  const { t } = useTranslation();

  const [phase, setPhase] = React.useState<MfaEnrollmentPhase>("intro");
  const [failure, setFailure] = React.useState<MfaEnrollmentFailure | null>(
    null,
  );
  const [secrets, setSecrets] = React.useState<MfaEnrollmentSecrets | null>(
    null,
  );
  // Confirmação visual de que os códigos foram guardados. Fica no hook para
  // sobreviver à ida e volta entre as telas da configuração.
  const [recoveryCodesSaved, setRecoveryCodesSaved] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Prazo absoluto da credencial da fase corrente, fim estimado do bloqueio por
  // tentativas e o relógio que os acompanha. `now` é estado (e não Date.now()
  // no render) para o componente ficar puro.
  const [expiresAt, setExpiresAt] = React.useState<number | null>(null);
  const [retryAt, setRetryAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(0);

  // Credenciais em refs: não são exibidas, então não precisam provocar render.
  const startTokenRef = React.useRef<string | null>(null);
  const passwordRef = React.useRef<string | null>(null);
  const confirmTokenRef = React.useRef<string | null>(null);
  const rememberMeRef = React.useRef(false);

  // Trava síncrona contra envios duplicados: o `isSubmitting` só reflete no
  // próximo render, tarde demais para um duplo clique ou Enter repetido.
  const inFlightRef = React.useRef(false);

  const deadlineIn = React.useCallback((seconds: number) => {
    const current = Date.now();
    setNow(current);
    return current + seconds * 1000;
  }, []);

  /** Descarta tudo o que o cadastro guardou em memória. */
  const clear = React.useCallback(() => {
    startTokenRef.current = null;
    passwordRef.current = null;
    confirmTokenRef.current = null;
    rememberMeRef.current = false;
    inFlightRef.current = false;
    setSecrets(null);
    setRecoveryCodesSaved(false);
    setPhase("intro");
    setFailure(null);
    setExpiresAt(null);
    setRetryAt(null);
    setFormError(undefined);
    setIsSubmitting(false);
  }, []);

  /** Sai do cadastro direto para as credenciais. */
  const restart = React.useCallback(
    (messageKey?: string) => {
      clear();
      onRestart(messageKey ? t(messageKey) : undefined);
    },
    [clear, onRestart, t],
  );

  /** Encerra o cadastro numa tela de falha — os segredos saem da memória. */
  const fail = React.useCallback(
    (reason: MfaEnrollmentFailure) => {
      clear();
      setPhase("failed");
      setFailure(reason);
      if (reason === "rateLimit") {
        setRetryAt(deadlineIn(MFA_RATE_LIMIT_WINDOW_SECONDS));
      }
    },
    [clear, deadlineIn],
  );

  const settle = React.useCallback(
    (outcome: Outcome) =>
      outcome.type === "fail"
        ? fail(outcome.failure)
        : restart(outcome.messageKey),
    [fail, restart],
  );

  // Relógio: vence o prazo da etapa (padrão 300 s, por fase) e alimenta a
  // contagem do bloqueio por tentativas. Não expira no meio de um envio — a
  // resposta do servidor decide esse caso.
  React.useEffect(() => {
    if (expiresAt === null && retryAt === null) return;

    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (expiresAt !== null && current >= expiresAt && !inFlightRef.current) {
        fail("timeout");
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [expiresAt, retryAt, fail]);

  /** Abre o cadastro com a credencial de início devolvida pelo login. */
  const begin = React.useCallback(
    ({
      enrollmentToken,
      password,
      expiresIn,
      rememberMe,
    }: MfaEnrollmentStart) => {
      clear();
      startTokenRef.current = enrollmentToken;
      passwordRef.current = password;
      rememberMeRef.current = rememberMe;
      setExpiresAt(deadlineIn(expiresIn));
    },
    [clear, deadlineIn],
  );

  /** Troca a credencial de início + senha pelos segredos do autenticador. */
  const startSetup = React.useCallback(async () => {
    if (inFlightRef.current) return;

    const enrollmentToken = startTokenRef.current;
    const password = passwordRef.current;
    if (!enrollmentToken || !password) {
      fail("timeout");
      return;
    }

    // A credencial de início é de uso único e a senha só existe para esta troca:
    // saem da memória antes mesmo da resposta. Se a troca falhar, o caminho é
    // sempre refazer o login — nunca reenviar às cegas.
    startTokenRef.current = null;
    passwordRef.current = null;

    inFlightRef.current = true;
    setIsSubmitting(true);
    setFormError(undefined);

    try {
      const data = await authService.mfaEnrollStart({
        enrollment_token: enrollmentToken,
        password,
      });

      confirmTokenRef.current = data.enrollment_token;
      setSecrets({
        otpauthUri: data.otpauth_uri,
        manualKey: data.manual_key,
        recoveryCodes: data.recovery_codes,
      });
      setExpiresAt(deadlineIn(data.expires_in));
      setPhase("qrCode");
      inFlightRef.current = false;
      setIsSubmitting(false);
    } catch (error) {
      settle(outcomeFor(error));
    }
  }, [deadlineIn, fail, settle]);

  /** Navega entre as telas da configuração (QR ↔ códigos ↔ TOTP). */
  const goTo = React.useCallback(
    (next: MfaEnrollmentSetupPhase) => {
      if (!SETUP_PHASES.includes(phase) || inFlightRef.current) return;
      // A validação só abre depois da confirmação de que os códigos foram
      // guardados — o backend não tem como verificar isso.
      if (next === "totp" && !recoveryCodesSaved) return;
      setFormError(undefined);
      setPhase(next);
    },
    [phase, recoveryCodesSaved],
  );

  /** Confirma o cadastro com o primeiro TOTP do autenticador. */
  const confirm = React.useCallback(
    async (totpCode: string) => {
      if (inFlightRef.current) return;

      const enrollmentToken = confirmTokenRef.current;
      if (!enrollmentToken) {
        fail("timeout");
        return;
      }

      inFlightRef.current = true;
      setIsSubmitting(true);
      setFormError(undefined);

      try {
        await authService.mfaEnrollConfirm({
          enrollment_token: enrollmentToken,
          totp_code: totpCode,
          rememberMe: rememberMeRef.current,
        });
      } catch (error) {
        // Código errado: mesma credencial, mesma tela. O prazo NÃO é renovado.
        if (upstreamErrorCode(error) === "INVALID_MFA_CODE") {
          setFormError(t("MfaEnrollment.errors.invalidCode"));
          inFlightRef.current = false;
          setIsSubmitting(false);
          return;
        }

        // Formato recusado: a validação não consome a credencial.
        if (error instanceof ValidationError) {
          setFormError(
            error.errors[0]?.detail ??
              upstreamDetailMessage(error) ??
              t("Mfa.errors.totpInvalid"),
          );
          inFlightRef.current = false;
          setIsSubmitting(false);
          return;
        }

        settle(outcomeFor(error));
        return;
      }

      // Sessão criada pelo BFF. Mantém a trava até a navegação para não haver
      // um segundo envio com a credencial já consumida.
      clear();
      inFlightRef.current = true;
      setIsSubmitting(true);
      onComplete();
    },
    [clear, fail, onComplete, settle, t],
  );

  /** Sai do cadastro (ou da tela de falha) e volta às credenciais. */
  const backToLogin = React.useCallback(() => restart(), [restart]);

  const secondsUntil = (deadline: number | null) =>
    deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));

  return {
    phase,
    failure,
    secrets,
    recoveryCodesSaved,
    setRecoveryCodesSaved,
    /** Segundos restantes da credencial da fase corrente. */
    secondsLeft: secondsUntil(expiresAt),
    /** Segundos estimados até o fim do bloqueio por tentativas. */
    retryInSeconds: secondsUntil(retryAt),
    formError,
    isSubmitting,
    begin,
    startSetup,
    goTo,
    confirm,
    backToLogin,
  };
}
