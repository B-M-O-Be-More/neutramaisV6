"use client";

import React from "react";

import {
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";

import type {
  CoverageLifecycleResult,
  UseCoverageFileLifecycleReturn,
} from "./interface";

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function failure(error: unknown): CoverageLifecycleResult {
  return {
    ok: false,
    errorKey:
      // Preview velho (alguém mudou o arquivo) ou substituto que não serve.
      error instanceof ConflictError
        ? "SellerCoverage.detail.errors.conflict"
        : error instanceof AuthError || error instanceof ForbiddenError
          ? "SellerCoverage.detail.errors.ownerOnly"
          : error instanceof NotFoundError
            ? "SellerCoverage.detail.errors.notFound"
            : "SellerCoverage.detail.errors.actionFailed",
  };
}

/**
 * Mudanças no ciclo de vida de um arquivo de cobertura na geo-api: restaurar
 * uma versão e arquivar o arquivo. Cada comando leva o `previewRevision`
 * lido no preview e uma chave de idempotência nova.
 */
export function useCoverageFileLifecycle(
  organizationId: string | null,
  fileId: string | null,
): UseCoverageFileLifecycleReturn {
  const [pending, setPending] = React.useState<string | null>(null);

  const restore = React.useCallback(
    async (
      versionId: string,
      expectedRevision: string,
    ): Promise<CoverageLifecycleResult> => {
      if (!organizationId || !fileId) return failure(null);
      setPending(versionId);
      try {
        await geoCoverageService.restoreVersion(fileId, {
          organizationId,
          expectedRevision,
          idempotencyKey: newIdempotencyKey(),
          versionId,
          // A troca das ofertas é explícita, oferta a oferta.
          moveBindings: false,
        });
        return { ok: true };
      } catch (error) {
        return failure(error);
      } finally {
        setPending(null);
      }
    },
    [organizationId, fileId],
  );

  const archive = React.useCallback(
    async (
      expectedRevision: string,
      replacementFileId?: string,
    ): Promise<CoverageLifecycleResult> => {
      if (!organizationId || !fileId) return failure(null);
      setPending("archive");
      try {
        // O substituto também é conferido pela revisão do preview dele.
        const replacement = replacementFileId
          ? {
              fileId: replacementFileId,
              revision: (
                await geoCoverageService.getFilePreview(
                  replacementFileId,
                  organizationId,
                )
              ).previewRevision,
            }
          : undefined;
        await geoCoverageService.archiveFile(fileId, {
          organizationId,
          expectedRevision,
          idempotencyKey: newIdempotencyKey(),
          replacement,
        });
        return { ok: true };
      } catch (error) {
        return failure(error);
      } finally {
        setPending(null);
      }
    },
    [organizationId, fileId],
  );

  return { pending, restore, archive };
}
