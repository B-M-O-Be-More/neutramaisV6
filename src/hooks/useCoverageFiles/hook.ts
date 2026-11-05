"use client";

import React from "react";

import { kmzFileName } from "@/functions/kmzFileNames";
import { AuthError, ForbiddenError } from "@/services/errors";
import {
  geoCoverageService,
  type CoverageFile,
  type CoverageVersionSummary,
} from "@/services/geoCoverage.service";

import type { UseCoverageFilesReturn } from "./interface";

// Teto da geo-api por página.
const PAGE_SIZE = 200;

/** Última resposta recebida, marcada com a consulta que a originou. */
interface FilesResult {
  key: string;
  organizationId: string;
  versions: CoverageVersionSummary[];
  error: string | null;
}

// Metadados da versão ativa; sem eles (falha pontual), o arquivo segue na
// lista com o que a listagem traz.
async function activeVersion(
  file: CoverageFile,
  organizationId: string,
  signal: AbortSignal,
): Promise<CoverageVersionSummary> {
  const fileName = kmzFileName(file.activeVersionId);
  try {
    const version = await geoCoverageService.getVersion(file.activeVersionId, {
      signal,
    });
    return { ...version, ...(fileName ? { fileName } : {}) };
  } catch (error) {
    if (signal.aborted) throw error;
    return {
      id: file.activeVersionId,
      organizationId,
      predecessorId: null,
      sourceSha256: "",
      createdAt: "",
      logicalFileId: file.fileId,
      originalAvailable: true,
      metadataAvailable: false,
      ...(fileName ? { fileName } : {}),
    };
  }
}

/**
 * Coberturas (KMZ) já enviadas pela organização, na geo-api: os arquivos não
 * arquivados (`GET /coverageFile`, todas as páginas) com os metadados da
 * versão ativa de cada um. Sem `organizationId`, não consulta.
 */
export function useCoverageFiles(
  organizationId: string | null,
): UseCoverageFilesReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<FilesResult | null>(null);

  const requestKey = `${organizationId}#${attempt}`;

  React.useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      const files: CoverageFile[] = [];
      for (;;) {
        const page = await geoCoverageService.listFiles(
          organizationId,
          { offset: files.length, limit: PAGE_SIZE, activeOnly: true },
          { signal },
        );
        files.push(...(page?.items ?? []));
        if (!page?.items.length || files.length >= page.total) break;
      }
      const versions = await Promise.all(
        files.map((file) => activeVersion(file, organizationId, signal)),
      );
      // Mais recentes primeiro; sem data, no fim.
      versions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return versions;
    })()
      .then((versions) =>
        setResult({ key: requestKey, organizationId, versions, error: null }),
      )
      .catch((error) => {
        if (signal.aborted) return;
        setResult((current) => ({
          key: requestKey,
          organizationId,
          versions:
            current?.organizationId === organizationId ? current.versions : [],
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "SellerCoverage.list.errors.forbidden"
              : "SellerCoverage.list.errors.failed",
        }));
      });

    return () => controller.abort();
  }, [organizationId, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  // Resposta desta organização (a atual ou, recarregando, a anterior).
  const known =
    organizationId && result?.organizationId === organizationId ? result : null;

  return {
    versions: known?.versions ?? [],
    isLoading: !!organizationId && !known,
    error: known?.key === requestKey ? known.error : null,
    reload,
  };
}
