"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { isInviteToken, readInviteToken } from "@/functions/inviteToken";
import { resolvePostLoginRoute } from "@/functions/postLoginRoute";
import { toE164 } from "@/functions/toE164";
import { useMfaEnrollment } from "@/hooks/useMfaEnrollment";
import { ACCEPT_PASSWORD_MESSAGES } from "@/schemas/platformInvite";
import { violationMessage } from "@/schemas/password";
import { invitesService } from "@/services/invites.service";
import {
  ApiError,
  ConflictError,
  RateLimitError,
  ValidationError,
  upstreamPasswordViolations,
} from "@/services/errors";

import type {
  AcceptInviteCreated,
  AcceptInviteFieldError,
  AcceptInviteInput,
  AcceptInviteStatus,
  UseAcceptInviteReturn,
} from "./interface";

// Campos da API → campos do formulário, para mostrar 422 no input certo.
const FIELD_MAP: Record<string, AcceptInviteFieldError["field"]> = {
  display_name: "displayName",
  phone: "phone",
  password: "password",
};

const LOGIN_ROUTE = "/login";

// Prazo do `mfa_enrollment_token` quando o aceite não informa (s).
const DEFAULT_ENROLLMENT_SECONDS = 300;

// Nada a observar: o useSyncExternalStore só separa servidor de browser.
const subscribeNothing = () => () => {};

/**
 * Aceite de convite (NEU-563): uma tela para convites de organização
 * (Buyer/Seller) e de administradores da plataforma. A tela não sabe — nem
 * informa — o tipo do convite: o Identity descobre pelo token e responde com
 * o `next_step`.
 *
 * O token chega no fragmento (`/accept/#token=...`), fica SÓ em memória e é
 * tirado da barra de endereço logo ao abrir. Nunca vai para log, analytics ou
 * storage. Abrir o link não consome o convite.
 *
 * Depois do aceite:
 * - plataforma (201, `login`): conta criada, MFA no primeiro login;
 * - organização `home`: a sessão já existe (cookies) → área autenticada;
 * - organização `mfa_enrollment`: cadastro do app com o token do aceite como
 *   Bearer; a sessão nasce no confirm;
 * - 409: o e-mail já tem conta → login na própria tela e `redeem`.
 */
export function useAcceptInvite(): UseAcceptInviteReturn {
  const router = useRouter();
  const params = useSearchParams();
  const queryToken = params.get("token") ?? "";

  // O fragmento só existe no browser: no servidor (e na hidratação) a tela
  // fica em `checking`. O token é lido uma vez, ao montar.
  const isBrowser = React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const [hashToken] = React.useState(() =>
    typeof window === "undefined"
      ? null
      : readInviteToken(window.location.hash),
  );
  // `?token=` fica como alternativa para links antigos.
  const token = hashToken ?? (isInviteToken(queryToken) ? queryToken : "");

  const [status, setStatus] = React.useState<AcceptInviteStatus>("form");
  const [created, setCreated] = React.useState<AcceptInviteCreated | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>();
  const [fieldError, setFieldError] = React.useState<
    AcceptInviteFieldError | undefined
  >();

  // Tira o token da barra de endereço, para ele não ficar no histórico nem
  // ser copiado junto com a URL.
  React.useEffect(() => {
    if (!hashToken) return;
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }, [hashToken]);

  const enterApp = React.useCallback(async () => {
    setStatus("entering");
    router.push(await resolvePostLoginRoute());
  }, [router]);

  // A conta já existe quando o cadastro do MFA é abandonado ou falha: o
  // caminho é o login, que reabre o cadastro. O aceite não pode ser repetido.
  const toLogin = React.useCallback(() => {
    router.push(LOGIN_ROUTE);
  }, [router]);
  const enrollment = useMfaEnrollment({
    onRestart: toLogin,
    onComplete: enterApp,
  });
  const beginEnrollment = enrollment.begin;

  const finishCreated = (reason: AcceptInviteCreated) => {
    setCreated(reason);
    setStatus("created");
  };

  const submit = async ({
    displayName,
    phone,
    password,
  }: AcceptInviteInput) => {
    if (!token) return;

    setFormError(undefined);
    setFieldError(undefined);
    setIsSubmitting(true);

    try {
      const result = await invitesService.accept({
        token,
        display_name: displayName.trim(),
        phone: toE164(phone),
        password,
      });

      // Plataforma: a conta existe, sem sessão; MFA no primeiro login.
      if (result.next_step === "login") {
        finishCreated("login");
        return;
      }

      if (result.next_step === "mfa_enrollment") {
        if (result.mfa_enrollment_token) {
          beginEnrollment({
            contract: "onboarding",
            enrollmentToken: result.mfa_enrollment_token,
            expiresIn:
              result.mfa_enrollment_expires_in ?? DEFAULT_ENROLLMENT_SECONDS,
            rememberMe: false,
          });
          setStatus("mfaEnrollment");
          return;
        }
        // Sem token não há como configurar aqui — e o convite já foi
        // consumido, então o aceite não pode ser repetido.
        finishCreated(
          result.mfa_enrollment_link_sent ? "mfaLink" : "mfaPending",
        );
        return;
      }

      // `home`: o BFF já gravou a sessão nos cookies.
      await enterApp();
    } catch (error) {
      // E-mail já cadastrado: o convite NÃO foi consumido.
      if (error instanceof ConflictError) {
        setStatus("existingAccount");
        return;
      }

      // A política de senha do upstream vem em `metadata.detail.violations`.
      const violations = upstreamPasswordViolations(error);
      if (violations) {
        const message = violations
          .map((v) => violationMessage(v, ACCEPT_PASSWORD_MESSAGES))
          .find(Boolean);
        setFieldError({
          field: "password",
          message: message ?? "PlatformInvite.errors.passwordPolicy",
        });
        return;
      }

      if (error instanceof ValidationError) {
        const field = Object.keys(error.fields).find((key) => FIELD_MAP[key]);
        if (field) {
          setFieldError({
            field: FIELD_MAP[field],
            message: "PlatformInvite.errors.fieldInvalid",
          });
        } else {
          setFormError("PlatformInvite.errors.invalid");
        }
        return;
      }

      if (error instanceof RateLimitError) {
        setFormError("PlatformInvite.errors.rateLimit");
        return;
      }

      // Indisponível: nada foi criado, dá para tentar de novo pelo botão.
      if (error instanceof ApiError && error.status === 503) {
        setFormError("PlatformInvite.errors.unavailable");
        return;
      }

      // 410 e o resto: convite inexistente, vencido, usado ou recusado.
      setStatus("invalid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startLogin = React.useCallback(() => setStatus("login"), []);

  // A sessão acabou de nascer no login desta tela; o token ainda está aqui.
  const redeem = React.useCallback(async () => {
    if (!token) return;
    setStatus("entering");
    try {
      await invitesService.redeem(token);
      router.push(await resolvePostLoginRoute());
    } catch (error) {
      setStatus(error instanceof ConflictError ? "redeemConflict" : "invalid");
    }
  }, [router, token]);

  return {
    status: !isBrowser ? "checking" : token ? status : "missing",
    created,
    isSubmitting,
    formError,
    fieldError,
    submit,
    enrollment,
    startLogin,
    redeem,
  };
}
