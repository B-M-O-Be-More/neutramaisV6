"use client";

import React from "react";

import { productCatalogService } from "@/services/productCatalog.service";
import type { PaginationMetadata } from "@/types/api.types";

import type {
  ListOrganizationOfferingsParams,
  ProductOffering,
  UseOrganizationOfferingsReturn,
} from "./interface";

/** Última resposta recebida, marcada com a requisição que a originou. */
interface ListResult {
  key: string;
  offerings: ProductOffering[];
  pagination: PaginationMetadata | null;
  hasError: boolean;
}

/**
 * Lista as ofertas da organização do usuário logado (marketplace-api, com
 * auth) e refaz a requisição sempre que a paginação muda. Requisições em voo
 * são canceladas ao trocar de página ou desmontar, para uma resposta antiga
 * não sobrescrever a atual.
 */
export function useOrganizationOfferings(
  params: ListOrganizationOfferingsParams = {},
): UseOrganizationOfferingsReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<ListResult | null>(null);

  // Serializa a paginação para o efeito não disparar a cada render quando o
  // chamador passa um objeto literal. A tentativa entra na chave para o
  // `refetch` voltar ao estado de carregamento.
  const paramsKey = JSON.stringify(params);
  const requestKey = `${paramsKey}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    const pagination = JSON.parse(paramsKey) as ListOrganizationOfferingsParams;

    productCatalogService
      .listOrganizationOfferings(pagination, { signal: controller.signal })
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

  // Carregando enquanto a última resposta não corresponde à requisição atual.
  const isCurrent = result?.key === requestKey;

  return {
    offerings: isCurrent ? result.offerings : [],
    pagination: result?.pagination ?? null,
    isLoading: !isCurrent,
    hasError: isCurrent && result.hasError,
    refetch,
  };
}
