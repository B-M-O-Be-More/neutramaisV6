"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { readInviteToken } from "@/functions/inviteToken";
import { toE164 } from "@/functions/toE164";
import { ACCEPT_PASSWORD_MESSAGES } from "@/schemas/platformInvite";
import { violationMessage } from "@/schemas/password";
import { platformInvitesService } from "@/services/platformInvites.service";
import {
  RateLimitError,
  ValidationError,
  upstreamPasswordViolations,
} from "@/services/errors";

import type {
  AcceptPlatformInviteFieldError,
  AcceptPlatformInviteInput,
  AcceptPlatformInviteStatus,
  UseAcceptPlatformInviteReturn,
} from "./interface";

// Campos da API → campos do formulário, para mostrar 422 no input certo.
const FIELD_MAP: Record<string, AcceptPlatformInviteFieldError["field"]> = {
  display_name: "displayName",
  phone: "phone",
  password: "password",
};

// Nada a observar: o useSyncExternalStore só separa servidor de browser.
const subscribeNothing = () => () => {};

/**
 * Cria a conta do operador convidado (`POST /platform-invites/accept`). O
 * token vem no fragmento do link do e-mail (`#token=...`) e É a credencial —
 * não há sessão. A query (`?token=...`) fica como alternativa.
 *
 * Erros são tratados aqui (SDD §12.4): senha fora da política e 422 de um
 * campo voltam para o formulário; qualquer outra falha colapsa no estado
 * `error`, que na prática significa convite expirado ou já usado.
 */
export function useAcceptPlatformInvite(): UseAcceptPlatformInviteReturn {
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
  const token = hashToken ?? queryToken;

  const [result, setResult] = React.useState<"form" | "success" | "error">(
    "form",
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>();
  const [fieldError, setFieldError] = React.useState<
    AcceptPlatformInviteFieldError | undefined
  >();

  // Tira o token da barra de endereço, para ele não ficar no histórico nem
  // ser copiado junto com a URL.
  React.useEffect(() => {
    if (!hashToken) return;
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }, [hashToken]);

  const status: AcceptPlatformInviteStatus = !isBrowser
    ? "checking"
    : token
      ? result
      : "missing";

  const submit = React.useCallback(
    async ({ displayName, phone, password }: AcceptPlatformInviteInput) => {
      if (!token) return;

      setFormError(undefined);
      setFieldError(undefined);
      setIsSubmitting(true);

      try {
        await platformInvitesService.accept({
          token,
          display_name: displayName.trim(),
          phone: toE164(phone),
          password,
        });
        setResult("success");
      } catch (error) {
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

        setResult("error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { status, isSubmitting, formError, fieldError, submit };
}
