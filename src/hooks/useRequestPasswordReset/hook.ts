"use client";

import React from "react";

import { authService } from "@/services/auth.service";

import type { ForgotPasswordStatus } from "./interface";

/**
 * Orquestra a solicitação do link de redefinição de senha (US-03):
 * `POST /auth/password-reset/request` e a máquina de estados da tela.
 *
 * Erros são tratados aqui (SDD §12.4: nunca no componente) e colapsados num
 * único estado `error`. Não distinguimos "e-mail inexistente" — o endpoint
 * responde 200 com a mesma mensagem exista ou não a conta, justamente para não
 * confirmar quais e-mails estão cadastrados; só chegamos a `error` em falha
 * real de transporte ou status não-2xx.
 */
export function useRequestPasswordReset() {
  const [status, setStatus] = React.useState<ForgotPasswordStatus>("form");
  const [email, setEmail] = React.useState("");

  const request = React.useCallback(async (value: string) => {
    setEmail(value);
    setStatus("loading");

    try {
      await authService.requestPasswordReset(value);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  /** Volta ao formulário mantendo o e-mail digitado ("Tentar com outro e-mail"). */
  const reset = React.useCallback(() => setStatus("form"), []);

  return { status, email, request, reset };
}
