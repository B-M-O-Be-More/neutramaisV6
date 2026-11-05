"use client";

import React from "react";

import { coverageAreaOf, type CoverageArea } from "@/functions/coverageAreas";
import { geoCoverageService } from "@/services/geoCoverage.service";

import type { UseCoverageAreasReturn } from "./interface";

/** Maior página da geo-api. */
const PAGE_SIZE = 500;
/** Páginas lidas no máximo (5.000 placemarks). */
const MAX_PAGES = 10;
/** Simplificação das geometrias (graus, ~20 m): só para desenhar. */
const TOLERANCE = 0.0002;

interface AreasResult {
  versionId: string;
  areas: CoverageArea[];
  error?: string;
  truncated: boolean;
}

/**
 * Áreas (placemarks com polígono) de uma versão de cobertura, lidas página a
 * página em `GET /coverageVersion/{id}/elements`. Pontos e linhas ficam de
 * fora — não têm área para recortar. Sem `versionId`, não busca.
 */
export function useCoverageAreas(
  versionId: string | null,
): UseCoverageAreasReturn {
  const [result, setResult] = React.useState<AreasResult | null>(null);

  React.useEffect(() => {
    if (!versionId) return;
    const controller = new AbortController();

    (async () => {
      const areas: CoverageArea[] = [];
      let afterIndex = -1;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const data = await geoCoverageService.listElements(
          versionId,
          { afterIndex, limit: PAGE_SIZE, tolerance: TOLERANCE },
          { signal: controller.signal },
        );
        for (const item of data?.items ?? []) {
          const area = coverageAreaOf(item);
          if (area) areas.push(area);
        }
        if (!data?.hasMore || data.nextCursor === null) {
          return { versionId, areas, truncated: false };
        }
        afterIndex = data.nextCursor;
      }
      return { versionId, areas, truncated: true };
    })()
      .then((loaded) => {
        if (!controller.signal.aborted) setResult(loaded);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          versionId,
          areas: [],
          error: "SellerOfferCreate.coverageScope.areas.loadError",
          truncated: false,
        });
      });

    return () => controller.abort();
  }, [versionId]);

  const isCurrent = !!versionId && result?.versionId === versionId;
  return {
    areas: isCurrent ? result.areas : [],
    isLoading: !!versionId && !isCurrent,
    error: isCurrent ? result.error : undefined,
    truncated: isCurrent ? result.truncated : false,
  };
}
