"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { authService } from "@/services/auth.service";
import { ValidationError } from "@/services/errors";

import type { ResetPasswordStatus } from "./interface";

/**
 * Efetiva a nova senha usando o token recebido por e-mail
 * (`POST /auth/password-reset/execute`). O token vem na query do link e É a
 * credencial da operação — não há sessão envolvida.
 *
 * Erros são tratados aqui (SDD §12.4): 422 vira mensagem inline no formulário
 * (a política do upstream pode ser mais estrita que a do schema); qualquer outra
 * falha colapsa no estado `error`, que na prática significa token expirado ou já
 * usado.
 */
export function useResetPassword() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = React.useState<ResetPasswordStatus>(
    token ? "form" : "missing",
  );
  const [formError, setFormError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submit = React.useCallback(
    async (newPassword: string) => {
      if (!token) return;

      setFormError(undefined);
      setIsSubmitting(true);

      try {
        await authService.executePasswordReset({
          token,
          new_password: newPassword,
        });
        setStatus("success");
      } catch (error) {
        if (error instanceof ValidationError) {
          setFormError(error.errors[0]?.detail ?? error.message);
          return;
        }
        setStatus("error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { status, formError, isSubmitting, submit };
}
