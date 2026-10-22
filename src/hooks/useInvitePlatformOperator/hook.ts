"use client";

import React from "react";

import { platformInvitesService } from "@/services/platformInvites.service";
import {
  AuthError,
  ConflictError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from "@/services/errors";

import type {
  InvitePlatformOperatorInput,
  UseInvitePlatformOperatorReturn,
} from "./interface";

/**
 * Convite de um operador da plataforma (`POST /admin/platform-invites`).
 * Exige `super_admin` com MFA na sessão. Erros são tratados aqui (SDD §12.4)
 * e reduzidos a uma chave de tradução.
 */
export function useInvitePlatformOperator(): UseInvitePlatformOperatorReturn {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | undefined>();
  const [sentTo, setSentTo] = React.useState<string | undefined>();

  const invite = React.useCallback(
    async ({ email, targetRole }: InvitePlatformOperatorInput) => {
      setFormError(undefined);
      setSentTo(undefined);
      setIsSubmitting(true);

      const normalizedEmail = email.trim().toLowerCase();
      try {
        await platformInvitesService.invite({
          email: normalizedEmail,
          role: targetRole,
        });
        setSentTo(normalizedEmail);
        return true;
      } catch (error) {
        setFormError(
          error instanceof AuthError || error instanceof ForbiddenError
            ? "PlatformInvite.errors.forbidden"
            : error instanceof ConflictError
              ? "PlatformInvite.errors.conflict"
              : error instanceof RateLimitError
                ? "PlatformInvite.errors.rateLimit"
                : error instanceof ValidationError
                  ? "PlatformInvite.errors.invalid"
                  : "PlatformInvite.errors.inviteFailed",
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { isSubmitting, formError, sentTo, invite };
}
