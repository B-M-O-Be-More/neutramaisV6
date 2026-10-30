"use client";

import React from "react";

import { productCatalogService } from "@/services/productCatalog.service";

import type { OfferingsSummary, UseOfferingsSummaryReturn } from "./interface";

/** Última resposta recebida, marcada com a tentativa que a originou. */
interface SummaryResult {
  attempt: number;
  summary: OfferingsSummary | null;
  hasError: boolean;
}

/**
 * Contadores do catálogo da organização do usuário logado (marketplace-api,
 * com auth). `refetch` atualiza os números depois de uma transição de status.
 */
export function useOfferingsSummary(): UseOfferingsSummaryReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<SummaryResult | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    productCatalogService
      .getOfferingsSummary({ signal: controller.signal })
      .then((summary) => {
        setResult({ attempt, summary, hasError: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ attempt, summary: null, hasError: true });
      });

    return () => controller.abort();
  }, [attempt]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);

  // Mantém os números anteriores enquanto recarrega, para os cards não
  // piscarem a cada transição.
  return {
    summary: result?.summary ?? null,
    isLoading: result?.attempt !== attempt,
    hasError: result?.attempt === attempt && result.hasError,
    refetch,
  };
}
