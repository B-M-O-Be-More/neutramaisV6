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
  KmzPreviewResult,
  KmzUploadOptions,
  KmzUploadResult,
  UseKmzUploadReturn,
} from "./interface";

/** Erro do envio ou da prévia → chave de tradução. */
function kmzErrorKey(error: unknown): string {
  if (error instanceof KmzParseError) {
    return `SellerOfferCreate.kmz.errors.${error.code}`;
  }
  if (error instanceof AuthError || error instanceof ForbiddenError) {
    return "SellerOfferCreate.kmz.errors.forbidden";
  }
  if (error instanceof ValidationError) {
    return "SellerOfferCreate.kmz.errors.rejected";
  }
  // 409: a cota de armazenamento da organização acabou.
  if (error instanceof ConflictError)
    return "SellerOfferCreate.kmz.errors.quota";
  // 429: a geo-api importa (ou pré-visualiza) um KMZ por vez.
  if (error instanceof RateLimitError) {
    return "SellerOfferCreate.kmz.errors.busy";
  }
  if (error instanceof TimeoutError) {
    return "SellerOfferCreate.kmz.errors.timeout";
  }
  if (error instanceof ServerError || error instanceof NetworkError) {
    return "SellerOfferCreate.kmz.errors.unavailable";
  }
  return "SellerOfferCreate.kmz.errors.failed";
}

/**
 * Upload de KMZ para a geo-api. O arquivo é lido no navegador antes: valida
 * o que dá para validar aqui (extensão, 50 MB, um único KML, alguma
 * geometria) e guarda a geometria para o mapa — a geo-api não a devolve.
 *
 * `preview` calcula o consumo na cota (`/kmz/preview`) para o seller
 * confirmar antes do envio; a leitura local fica guardada e o `upload` do
 * mesmo arquivo não lê de novo.
 */
export function useKmzUpload(
  organizationId: string | null,
): UseKmzUploadReturn {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const parsedRef = React.useRef(
    new WeakMap<File, Awaited<ReturnType<typeof parseKmz>>>(),
  );

  const parse = React.useCallback(async (file: File) => {
    const cached = parsedRef.current.get(file);
    if (cached) return cached;
    const parsed = await parseKmz(file);
    parsedRef.current.set(file, parsed);
    return parsed;
  }, []);

  const preview = React.useCallback(
    async (
      file: File,
      options: KmzUploadOptions = {},
    ): Promise<KmzPreviewResult> => {
      if (!organizationId) {
        return { ok: false, errorKey: "SellerOfferCreate.kmz.errors.failed" };
      }
      setIsPreviewing(true);
      try {
        await parse(file);
        const result = await geoCoverageService.previewKmz({
          organizationId,
          file,
          ...options,
        });
        return { ok: true, preview: result! };
      } catch (error) {
        return { ok: false, errorKey: kmzErrorKey(error) };
      } finally {
        setIsPreviewing(false);
      }
    },
    [organizationId, parse],
  );

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
        const parsed = await parse(file);
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
        return { ok: false, errorKey: kmzErrorKey(error) };
      } finally {
        setIsUploading(false);
      }
    },
    [organizationId, parse],
  );

  return { isUploading, upload, isPreviewing, preview };
}
