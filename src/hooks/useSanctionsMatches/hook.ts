"use client";

import React from "react";

import { adminService } from "@/services/admin.service";
import { AuthError, ForbiddenError } from "@/services/errors";

import type {
  SanctionsMatch,
  UseSanctionsMatchesOptions,
  UseSanctionsMatchesReturn,
} from "./interface";

/** Última resposta recebida, marcada com a consulta que a originou. */
interface MatchesResult {
  key: string;
  matches: SanctionsMatch[];
  error: string | null;
}

/**
 * Ocorrências de sanções da organização (identity-api), para o revisor saber
 * em qual lista ela bateu e por quê (documento ou razão social). Só consulta
 * com `enabled` — quando a checagem falhou.
 */
export function useSanctionsMatches({
  organizationId,
  enabled,
  refreshKey = null,
}: UseSanctionsMatchesOptions): UseSanctionsMatchesReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<MatchesResult | null>(null);

  const requestKey = `${organizationId}#${refreshKey ?? ""}#${attempt}`;

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    adminService
      .getSanctionsMatches(organizationId, { signal: controller.signal })
      .then((data) => {
        setResult({
          key: requestKey,
          matches: data?.matches ?? [],
          error: null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          matches: [],
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "Admin.review.sanctionsMatches.errors.forbidden"
              : "Admin.review.sanctionsMatches.errors.loadFailed",
        });
      });

    return () => controller.abort();
  }, [enabled, organizationId, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  const isCurrent = result?.key === requestKey;

  return {
    matches: enabled && isCurrent ? result.matches : [],
    isLoading: enabled && !isCurrent,
    error: enabled && isCurrent ? result.error : null,
    reload,
  };
}
