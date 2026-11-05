"use client";

import React from "react";

import {
  geoCoverageService,
  type CoverageVersion,
} from "@/services/geoCoverage.service";

import type { UseCoverageVersionReturn } from "./interface";

/**
 * Metadados de uma versão de cobertura na geo-api (ex.: a já vinculada à
 * oferta em edição). Falha (404/403/rede) volta como versão ausente.
 */
export function useCoverageVersion(
  versionId: string | null,
): UseCoverageVersionReturn {
  const [result, setResult] = React.useState<{
    versionId: string;
    version: CoverageVersion | null;
  } | null>(null);

  React.useEffect(() => {
    if (!versionId) return;
    const controller = new AbortController();

    geoCoverageService
      .getVersion(versionId, { signal: controller.signal })
      .then((version) => setResult({ versionId, version: version ?? null }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ versionId, version: null });
      });

    return () => controller.abort();
  }, [versionId]);

  const isCurrent = !!versionId && result?.versionId === versionId;
  return {
    version: isCurrent ? result.version : null,
    isLoading: !!versionId && !isCurrent,
  };
}
