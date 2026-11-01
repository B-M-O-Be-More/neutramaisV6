"use client";

import React from "react";

import type { CoverageGeoJson } from "@/components/CoverageMap";
import { KmzParseError, parseKmz } from "@/functions/parseKmz";
import { NotFoundError } from "@/services/errors";
import {
  geoCoverageService,
  type CoverageVersionSummary,
} from "@/services/geoCoverage.service";

import type {
  CoverageGeometryInfo,
  UseCoverageGeometryReturn,
} from "./interface";

// Geometrias já lidas por esta tela. Poucas: um KMZ grande ocupa centenas de
// MB de memória depois de lido.
const CACHE_SIZE = 3;

interface Loaded {
  geometry: CoverageGeoJson | null;
  info: CoverageGeometryInfo | null;
  error: string | null;
}

const IDLE: UseCoverageGeometryReturn = {
  geometry: null,
  info: null,
  isLoading: false,
  error: null,
};

/**
 * Área de uma versão de cobertura para o mapa. A geo-api não devolve a
 * geometria: baixa o KMZ original retido (`/coverageFile/{id}/download`) e o
 * lê no navegador, como no envio. `known` é a geometria já lida no envio
 * desta sessão — com ela, não baixa nada.
 */
export function useCoverageGeometry(
  organizationId: string | null,
  version: CoverageVersionSummary | null,
  known?: CoverageGeoJson | null,
): UseCoverageGeometryReturn {
  // Lidas, da mais antiga para a mais recente.
  const [loaded, setLoaded] = React.useState<[string, Loaded][]>([]);
  const loadedIds = React.useRef(new Set<string>());

  const versionId = version?.id ?? null;
  const fileId = version?.logicalFileId ?? null;
  // Versão antiga, enviada antes de a geo-api reter o original.
  const noOriginal = !!version && !version.originalAvailable;
  const shouldDownload =
    !!organizationId && !!versionId && known === undefined && !noOriginal;

  React.useEffect(() => {
    if (!shouldDownload || !organizationId || !versionId || !fileId) return;
    if (loadedIds.current.has(versionId)) return;

    const controller = new AbortController();
    const remember = (entry: Loaded) => {
      if (controller.signal.aborted) return;
      setLoaded((current) => {
        const next = [
          ...current.filter(([id]) => id !== versionId),
          [versionId, entry] as [string, Loaded],
        ].slice(-CACHE_SIZE);
        loadedIds.current = new Set(next.map(([id]) => id));
        return next;
      });
    };

    (async () => {
      const blob = await geoCoverageService.downloadOriginal(
        fileId,
        organizationId,
        { versionId, signal: controller.signal },
      );
      const parsed = await parseKmz(
        new File([blob], `${versionId}.kmz`, {
          type: "application/vnd.google-earth.kmz",
        }),
      );
      remember({
        geometry: parsed.geometry as CoverageGeoJson | null,
        info: {
          sizeBytes: blob.size,
          regionCount: parsed.regionCount,
          polygonCount: parsed.polygonCount,
        },
        error: null,
      });
    })().catch((error) =>
      remember({
        geometry: null,
        info: null,
        error:
          error instanceof NotFoundError
            ? "SellerOfferCreate.coverage.preview.noOriginal"
            : error instanceof KmzParseError
              ? "SellerOfferCreate.coverage.preview.unreadable"
              : "SellerOfferCreate.coverage.preview.failed",
      }),
    );

    return () => controller.abort();
  }, [shouldDownload, organizationId, versionId, fileId]);

  if (!versionId) return IDLE;
  if (known !== undefined) return { ...IDLE, geometry: known };
  if (noOriginal) {
    return { ...IDLE, error: "SellerOfferCreate.coverage.preview.noOriginal" };
  }
  const entry = loaded.find(([id]) => id === versionId)?.[1];
  return entry
    ? { ...entry, isLoading: false }
    : { ...IDLE, isLoading: !!organizationId };
}
