"use client";

import React from "react";

import { authService } from "@/services/auth.service";
import {
  ApiError,
  AuthError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@/services/errors";

import type { ConfirmPhoneStatus, UseConfirmPhoneResult } from "./interface";

/**
 * Confirmação do telefone por OTP na etapa de Verificação do cadastro (US-02).
 *
 * Duas chamadas em sequência, ambas públicas — o usuário ainda não tem sessão,
 * então o `user_id` (recebido no link de confirmação do e-mail) é o que o
 * identifica:
 *   1. `POST /auth/resend-phone-otp` dispara o SMS → status `sent`;
 *   2. `POST /auth/confirm-phone` valida o código → status `confirmed`.
 *
 * Erros são tratados aqui (SDD §12.4: nunca no componente) e reduzidos a uma
 * chave de tradução em `error`.
 */
export function useConfirmPhone(userId?: string): UseConfirmPhoneResult {
  const [status, setStatus] = React.useState<ConfirmPhoneStatus>("idle");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const sendCode = React.useCallback(async () => {
    if (!userId) {
      setError("Register.flow.verify.phone.errors.missingUser");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.resendPhoneOtp(userId);
      // Só aqui o campo de código é liberado: sem 200 não há SMS a digitar.
      setStatus("sent");
    } catch (cause) {
      setError(
        cause instanceof RateLimitError
          ? "Register.flow.verify.phone.errors.rateLimit"
          : "Register.flow.verify.phone.errors.send",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const confirm = React.useCallback(
    async (otp: string) => {
      if (!userId) {
        setError("Register.flow.verify.phone.errors.missingUser");
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await authService.confirmPhone({ user_id: userId, otp });
        setStatus("confirmed");
        return true;
      } catch (cause) {
        // 401/404/422 são todos "código não confere ou expirou" — o upstream não
        // distingue de forma útil para a tela. 429 vira reenviar mais tarde.
        const invalid =
          cause instanceof ValidationError ||
          cause instanceof AuthError ||
          cause instanceof NotFoundError ||
          (cause instanceof ApiError && cause.status === 400);

        setError(
          cause instanceof RateLimitError
            ? "Register.flow.verify.phone.errors.rateLimit"
            : invalid
              ? "Register.flow.verify.phone.errors.invalidCode"
              : "Register.flow.verify.phone.errors.confirm",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  return { status, loading, error, sendCode, confirm };
}
