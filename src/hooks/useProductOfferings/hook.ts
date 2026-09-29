"use client";

import React from "react";

import { productCatalogService } from "@/services/productCatalog.service";
import type { PaginationMetadata } from "@/types/api.types";

import type {
  ProductOffering,
  SearchProductOfferingsParams,
  UseProductOfferingsReturn,
} from "./interface";

/** Última resposta recebida, marcada com a busca que a originou. */
interface SearchResult {
  key: string;
  offerings: ProductOffering[];
  pagination: PaginationMetadata | null;
  hasError: boolean;
}

/**
 * Busca ofertas públicas do catálogo (marketplace-api, sem auth) e refaz a
 * busca sempre que os filtros mudam. Requisições em voo são canceladas ao
 * trocar de filtro ou desmontar, para uma resposta antiga não sobrescrever a
 * atual.
 */
export function useProductOfferings(
  params: SearchProductOfferingsParams = {},
): UseProductOfferingsReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<SearchResult | null>(null);

  // Serializa os filtros para o efeito não disparar a cada render quando o
  // chamador passa um objeto literal. A tentativa entra na chave para o
  // `refetch` voltar ao estado de carregamento.
  const paramsKey = JSON.stringify(params);
  const requestKey = `${paramsKey}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    const filters = JSON.parse(paramsKey) as SearchProductOfferingsParams;

    productCatalogService
      .searchOfferings(filters, { signal: controller.signal })
      .then((response) => {
        setResult({
          key: requestKey,
          offerings: response.data ?? [],
          pagination: response.metadata,
          hasError: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          offerings: [],
          pagination: null,
          hasError: true,
        });
      });

    return () => controller.abort();
  }, [paramsKey, requestKey]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);

  // Carregando enquanto a última resposta não corresponde à busca atual.
  const isCurrent = result?.key === requestKey;

  return {
    offerings: isCurrent ? result.offerings : [],
    pagination: result?.pagination ?? null,
    isLoading: !isCurrent,
    hasError: isCurrent && result.hasError,
    refetch,
  };
}
