"use client";

import React from "react";

import { ForbiddenError, NotFoundError } from "@/services/errors";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import type { UseOfferingReturn } from "./interface";

/** Última resposta recebida, marcada com a tentativa que a originou. */
interface OfferingResult {
  key: string;
  offering: ProductOffering | null;
  notFound: boolean;
  hasError: boolean;
}

/**
 * Detalhe de uma oferta da organização do usuário logado. Oferta de outra
 * organização (403) é tratada como inexistente — o seller não deve saber que
 * ela existe.
 */
export function useOffering(offeringId: string): UseOfferingReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<OfferingResult | null>(null);
  const key = `${offeringId}:${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();

    productCatalogService
      .getOffering(offeringId, { signal: controller.signal })
      .then((offering) => {
        setResult({
          key,
          offering: offering ?? null,
          notFound: !offering,
          hasError: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const notFound =
          error instanceof NotFoundError || error instanceof ForbiddenError;
        setResult({ key, offering: null, notFound, hasError: !notFound });
      });

    return () => controller.abort();
  }, [offeringId, key]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);
  const current = result?.key === key ? result : null;

  // Mantém a oferta anterior enquanto recarrega (ex.: após patrocinar).
  return {
    offering: result?.offering ?? null,
    isLoading: !current,
    notFound: !!current?.notFound,
    hasError: !!current?.hasError,
    refetch,
  };
}
