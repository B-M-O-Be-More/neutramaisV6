"use client";

import React from "react";

import {
  productCatalogService,
  type OfferingImage,
} from "@/services/productCatalog.service";

import type { UseOfferingImagesReturn } from "./interface";

/** Última resposta recebida, marcada com a tentativa que a originou. */
interface ImagesResult {
  key: string;
  images: OfferingImage[];
  hasError: boolean;
}

/**
 * Imagens confirmadas de uma oferta da organização. As pendentes (envio
 * autorizado e não confirmado) ficam de fora — não aparecem na oferta.
 */
export function useOfferingImages(offeringId: string): UseOfferingImagesReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<ImagesResult | null>(null);
  const key = `${offeringId}:${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();

    productCatalogService
      .listImages(offeringId, { signal: controller.signal })
      .then((images) => {
        setResult({
          key,
          images: (images ?? [])
            .filter((image) => image.status === "ready")
            .sort((a, b) => a.position - b.position),
          hasError: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key, images: [], hasError: true });
      });

    return () => controller.abort();
  }, [offeringId, key]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);
  const current = result?.key === key ? result : null;

  return {
    images: current?.images ?? [],
    isLoading: !current,
    hasError: !!current?.hasError,
    refetch,
  };
}
