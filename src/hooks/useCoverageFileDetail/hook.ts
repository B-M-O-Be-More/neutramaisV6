"use client";

import React from "react";

import { kmzFileName } from "@/functions/kmzFileNames";
import { AuthError, ForbiddenError, NotFoundError } from "@/services/errors";
import {
  geoCoverageService,
  type CoverageFilePreview,
  type CoverageFileVersion,
  type CoverageVersionSummary,
  type GeoPage,
} from "@/services/geoCoverage.service";

import type { UseCoverageFileDetailReturn } from "./interface";

// Teto da geo-api por página.
const PAGE_SIZE = 200;

interface DetailData {
  preview: CoverageFilePreview;
  versions: CoverageFileVersion[];
  offerCounts: Map<string, number>;
  activeVersion: CoverageVersionSummary;
}

/** Última resposta recebida, marcada com a consulta que a originou. */
interface DetailResult {
  key: string;
  target: string;
  data: DetailData | null;
  error: string | null;
}

/** Todas as páginas de uma lista da geo-api. */
async function readAll<T>(
  page: (offset: number) => Promise<GeoPage<T>>,
): Promise<T[]> {
  const items: T[] = [];
  for (;;) {
    const current = await page(items.length);
    items.push(...(current?.items ?? []));
    if (!current?.items.length || items.length >= current.total) break;
  }
  return items;
}

function errorKey(error: unknown): string {
  if (error instanceof NotFoundError) {
    return "SellerCoverage.detail.errors.notFound";
  }
  if (error instanceof AuthError || error instanceof ForbiddenError) {
    return "SellerCoverage.list.errors.forbidden";
  }
  return "SellerCoverage.detail.errors.failed";
}

/**
 * Detalhe de um arquivo de cobertura na geo-api: o preview (versão ativa e
 * vínculos), o histórico de versões, as ofertas de cada versão e os metadados
 * da versão ativa. Sem organização ou arquivo, não consulta.
 */
export function useCoverageFileDetail(
  organizationId: string | null,
  fileId: string | null,
): UseCoverageFileDetailReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<DetailResult | null>(null);

  const target = `${organizationId}/${fileId}`;
  const requestKey = `${target}#${attempt}`;

  React.useEffect(() => {
    if (!organizationId || !fileId) return;
    const controller = new AbortController();
    const { signal } = controller;

    (async (): Promise<DetailData> => {
      const [preview, versions, offers] = await Promise.all([
        geoCoverageService.getFilePreview(fileId, organizationId, { signal }),
        readAll((offset) =>
          geoCoverageService.listFileVersions(
            fileId,
            organizationId,
            { offset, limit: PAGE_SIZE },
            { signal },
          ),
        ),
        readAll((offset) =>
          geoCoverageService.listFileOffers(
            fileId,
            organizationId,
            { offset, limit: PAGE_SIZE },
            { signal },
          ),
        ),
      ]);
      const version = await geoCoverageService.getVersion(
        preview.activeVersionId,
        { signal },
      );
      const fileName = kmzFileName(version.id);

      const offerCounts = new Map<string, number>();
      for (const offer of offers) {
        offerCounts.set(
          offer.versionId,
          (offerCounts.get(offer.versionId) ?? 0) + 1,
        );
      }
      return {
        preview,
        versions,
        offerCounts,
        activeVersion: { ...version, ...(fileName ? { fileName } : {}) },
      };
    })()
      .then((data) => setResult({ key: requestKey, target, data, error: null }))
      .catch((error) => {
        if (signal.aborted) return;
        setResult((current) => ({
          key: requestKey,
          target,
          // Recarregando, mantém o que já estava na tela.
          data: current?.target === target ? current.data : null,
          error: errorKey(error),
        }));
      });

    return () => controller.abort();
  }, [organizationId, fileId, target, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  // Resposta deste arquivo (a atual ou, recarregando, a anterior).
  const known = result?.target === target ? result : null;

  return {
    preview: known?.data?.preview ?? null,
    versions: known?.data?.versions ?? [],
    offerCounts: known?.data?.offerCounts ?? EMPTY_COUNTS,
    activeVersion: known?.data?.activeVersion ?? null,
    isLoading: !!organizationId && !!fileId && !known,
    error: known?.key === requestKey ? known.error : null,
    reload,
  };
}

const EMPTY_COUNTS = new Map<string, number>();
