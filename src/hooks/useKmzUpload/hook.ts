"use client";

import React from "react";

import { rememberKmzFileName } from "@/functions/kmzFileNames";
import { KmzParseError, parseKmz } from "@/functions/parseKmz";
import {
  AuthError,
  ConflictError,
  ForbiddenError,
  NetworkError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
} from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";

import type {
  KmzUploadOptions,
  KmzUploadResult,
  UseKmzUploadReturn,
} from "./interface";

/**
 * Upload de KMZ para a geo-api. O arquivo é lido no navegador antes: valida
 * o que dá para validar aqui (extensão, 50 MB, um único KML, alguma
 * geometria) e guarda a geometria para o mapa — a geo-api não a devolve.
 */
export function useKmzUpload(
  organizationId: string | null,
): UseKmzUploadReturn {
  const [isUploading, setIsUploading] = React.useState(false);

  const upload = React.useCallback(
    async (
      file: File,
      options: KmzUploadOptions = {},
    ): Promise<KmzUploadResult> => {
      if (!organizationId) {
        return { ok: false, errorKey: "SellerOfferCreate.kmz.errors.failed" };
      }

      setIsUploading(true);
      try {
        const parsed = await parseKmz(file);
        const version = await geoCoverageService.uploadKmz({
          organizationId,
          file,
          ...options,
        });
        rememberKmzFileName(version.id, file.name);
        return {
          ok: true,
          version: {
            ...version,
            fileName: file.name,
            sizeBytes: file.size,
            regionCount: parsed.regionCount,
            polygonCount: parsed.polygonCount,
          },
          geometry: parsed.geometry,
        };
      } catch (error) {
        return {
          ok: false,
          errorKey:
            error instanceof KmzParseError
              ? `SellerOfferCreate.kmz.errors.${error.code}`
              : error instanceof AuthError || error instanceof ForbiddenError
                ? "SellerOfferCreate.kmz.errors.forbidden"
                : error instanceof ValidationError
                  ? "SellerOfferCreate.kmz.errors.rejected"
                  : // 409: a cota de armazenamento da organização acabou.
                    error instanceof ConflictError
                    ? "SellerOfferCreate.kmz.errors.quota"
                    : // 429: a geo-api importa um KMZ por vez.
                      error instanceof RateLimitError
                      ? "SellerOfferCreate.kmz.errors.busy"
                      : error instanceof TimeoutError
                        ? "SellerOfferCreate.kmz.errors.timeout"
                        : error instanceof ServerError ||
                            error instanceof NetworkError
                          ? "SellerOfferCreate.kmz.errors.unavailable"
                          : "SellerOfferCreate.kmz.errors.failed",
        };
      } finally {
        setIsUploading(false);
      }
    },
    [organizationId],
  );

  return { isUploading, upload };
}
