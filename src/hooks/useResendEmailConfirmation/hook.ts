"use client";

import React from "react";

import { authService } from "@/services/auth.service";
import { RateLimitError } from "@/services/errors";

import type {
  ResendEmailConfirmationStatus,
  UseResendEmailConfirmationResult,
} from "./interface";

/**
 * Reenvio do link de confirmação de e-mail na etapa de Verificação do cadastro.
 *
 * Rota pública: quem identifica o usuário é o `user_id`. Cada reenvio invalida o
 * link anterior e o backend limita a 3 por usuário por hora — o 429 vira uma
 * mensagem própria.
 *
 * Erros são tratados aqui (SDD §12.4: nunca no componente) e reduzidos a uma
 * chave de tradução em `error`.
 */
export function useResendEmailConfirmation(
  userId?: string,
): UseResendEmailConfirmationResult {
  const [status, setStatus] =
    React.useState<ResendEmailConfirmationStatus>("idle");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resend = React.useCallback(async () => {
    if (!userId) {
      setError("Register.flow.verify.email.errors.missingUser");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.resendEmailConfirmation(userId);
      setStatus("sent");
    } catch (cause) {
      setError(
        cause instanceof RateLimitError
          ? "Register.flow.verify.email.errors.rateLimit"
          : "Register.flow.verify.email.errors.resend",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { status, loading, error, resend };
}
