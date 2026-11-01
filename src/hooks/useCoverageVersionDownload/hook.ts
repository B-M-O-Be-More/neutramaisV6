"use client";

import React from "react";

import { downloadBlob } from "@/functions/downloadBlob";
import { NotFoundError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";

import type { UseCoverageVersionDownloadReturn } from "./interface";

/**
 * Download do KMZ original de uma versão (`/coverageFile/{id}/download` com
 * `version_id`), pelo BFF — a geo-api nunca expõe uma URL pública.
 */
export function useCoverageVersionDownload(
  organizationId: string | null,
  fileId: string | null,
): UseCoverageVersionDownloadReturn {
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const download = React.useCallback(
    async (versionId: string, fileName: string) => {
      if (!organizationId || !fileId) {
        return "SellerCoverage.detail.errors.downloadFailed";
      }
      setDownloadingId(versionId);
      try {
        const blob = await geoCoverageService.downloadOriginal(
          fileId,
          organizationId,
          { versionId },
        );
        downloadBlob(fileName, blob);
        return null;
      } catch (error) {
        return error instanceof NotFoundError
          ? "SellerOfferCreate.coverage.preview.noOriginal"
          : "SellerCoverage.detail.errors.downloadFailed";
      } finally {
        setDownloadingId(null);
      }
    },
    [organizationId, fileId],
  );

  return { downloadingId, download };
}
