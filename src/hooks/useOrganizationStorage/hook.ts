"use client";

import React from "react";

import { AuthError, ForbiddenError, ValidationError } from "@/services/errors";
import {
  geoStorageService,
  type OrganizationStorage,
  type UpdateQuotaInput,
} from "@/services/geoStorage.service";

import type {
  UpdateQuotaResult,
  UseOrganizationStorageReturn,
} from "./interface";

/** Última resposta recebida, marcada com a consulta que a originou. */
interface StorageResult {
  key: string;
  storage: OrganizationStorage | null;
  error: string | null;
}

/**
 * Cota e consumo de armazenamento de cobertura (KMZ) da organização, na
 * geo-api. Sem `organizationId`, não consulta.
 */
export function useOrganizationStorage(
  organizationId: string | null,
): UseOrganizationStorageReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<StorageResult | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const requestKey = `${organizationId}#${attempt}`;

  React.useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();

    geoStorageService
      .getStorage(organizationId, { signal: controller.signal })
      .then((storage) =>
        setResult({ key: requestKey, storage: storage ?? null, error: null }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          storage: null,
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "CoverageStorage.errors.forbidden"
              : "CoverageStorage.errors.loadFailed",
        });
      });

    return () => controller.abort();
  }, [organizationId, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  const updateQuota = React.useCallback(
    async (input: UpdateQuotaInput): Promise<UpdateQuotaResult> => {
      if (!organizationId) {
        return { ok: false, errorKey: "CoverageStorage.quota.errors.failed" };
      }
      setIsSaving(true);
      try {
        const storage = await geoStorageService.updateQuota(
          organizationId,
          input,
        );
        setResult({ key: requestKey, storage, error: null });
        return { ok: true, storage };
      } catch (error) {
        return {
          ok: false,
          errorKey:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "CoverageStorage.quota.errors.forbidden"
              : error instanceof ValidationError
                ? "CoverageStorage.quota.errors.rejected"
                : "CoverageStorage.quota.errors.failed",
        };
      } finally {
        setIsSaving(false);
      }
    },
    [organizationId, requestKey],
  );

  const isCurrent = result?.key === requestKey;

  return {
    storage: organizationId && isCurrent ? result.storage : null,
    isLoading: !!organizationId && !isCurrent,
    error: organizationId && isCurrent ? result.error : null,
    reload,
    isSaving,
    updateQuota,
  };
}
