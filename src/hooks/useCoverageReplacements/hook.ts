"use client";

import React from "react";

import { kmzFileName } from "@/functions/kmzFileNames";
import { geoCoverageService } from "@/services/geoCoverage.service";

import type {
  CoverageReplacementOption,
  UseCoverageReplacementsReturn,
} from "./interface";

interface ReplacementsResult {
  key: string;
  options: CoverageReplacementOption[];
  error: string | null;
}

/**
 * Candidatos a substituir um arquivo de cobertura (`GET /coverageFile` com
 * `active_only` e `exclude_file_id`, o `replacementsPath` do preview). Só
 * consulta com `enabled` — ao abrir a exclusão de um arquivo com ofertas.
 */
export function useCoverageReplacements(
  organizationId: string | null,
  fileId: string | null,
  enabled: boolean,
): UseCoverageReplacementsReturn {
  const [result, setResult] = React.useState<ReplacementsResult | null>(null);
  const key = `${organizationId}/${fileId}`;
  const shouldLoad = enabled && !!organizationId && !!fileId;

  React.useEffect(() => {
    if (!shouldLoad || !organizationId || !fileId) return;
    const controller = new AbortController();

    geoCoverageService
      .listFiles(
        organizationId,
        { limit: 200, activeOnly: true, excludeFileId: fileId },
        { signal: controller.signal },
      )
      .then((page) =>
        setResult({
          key,
          options: (page?.items ?? []).map((file) => ({
            fileId: file.fileId,
            label:
              kmzFileName(file.activeVersionId) ??
              `KMZ ${file.activeVersionId.slice(0, 8)}`,
          })),
          error: null,
        }),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          options: [],
          error: "SellerCoverage.detail.archive.replacementsFailed",
        });
      });

    return () => controller.abort();
  }, [shouldLoad, organizationId, fileId, key]);

  const known = result?.key === key ? result : null;
  return {
    options: known?.options ?? [],
    isLoading: shouldLoad && !known,
    error: known?.error ?? null,
  };
}
