// Service do catálogo de produtos (marketplace-api, TMF620).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/*`); os route handlers fazem proxy pra marketplace-api.

import { api, RequestOptions } from "./api.client";

/**
 * Valor decimal em reais. O upstream serializa como número ou string decimal
 * (ex.: 1990 ou "1990.00") — normalize com `Number()` antes de formatar.
 */
export type DecimalValue = number | string;

/** Oferta pública retornada por `GET /productCatalog/productOffering/search`. */
export interface ProductOffering {
  id: string;
  organizationId: string;
  specificationId: string;
  name: string;
  monthlyPrice: DecimalValue;
  installationPrice: DecimalValue;
  /** Texto livre, ex.: "500 Mbps". Ausente em ofertas que não são de conectividade. */
  speed: string | null;
  durationMonths: number | null;
  isPublic: boolean;
  isCorporate: boolean;
  /** UF, duas letras (ex.: "SP"). */
  stateCode: string | null;
  isCapital: boolean | null;
  /** Atributos livres definidos pela especificação (ex.: { ipFixo: true }). */
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Filtros de `GET /productCatalog/productOffering/search` (combinados por AND). */
export interface SearchProductOfferingsParams {
  /** UF, duas letras. */
  stateCode?: string;
  /** Nome exato da especificação. */
  specificationName?: string;
  isCorporate?: boolean;
  /** Preço mensal máximo, inclusivo. */
  maxPrice?: DecimalValue;
  /** Começa em 1. */
  page?: number;
  /** 1–100 (default 20 no upstream). */
  pageSize?: number;
}

/** Paginação de `GET /productCatalog/productOffering` (por deslocamento). */
export interface ListOrganizationOfferingsParams {
  /** Quantos itens pular. Começa em 0. */
  offset?: number;
  /** Tamanho da página. */
  limit?: number;
}

export const productCatalogService = {
  /**
   * Lista as ofertas da organização do usuário logado (Bearer via BFF).
   * O envelope traz a paginação em `metadata` (page/pageSize/totalCount).
   */
  listOrganizationOfferings: (
    params: ListOrganizationOfferingsParams = {},
    options: Pick<RequestOptions, "signal"> = {},
  ) =>
    api.request<ProductOffering[]>(
      "GET",
      "/productCatalog/productOffering",
      null,
      { params: { ...params }, signal: options.signal },
    ),

  /**
   * Busca ofertas públicas (sem auth). Devolve o resultado completo do
   * envelope — `metadata` traz a paginação.
   */
  searchOfferings: (
    params: SearchProductOfferingsParams = {},
    options: Pick<RequestOptions, "signal"> = {},
  ) =>
    api.request<ProductOffering[]>(
      "GET",
      "/productCatalog/productOffering/search",
      null,
      { params: { ...params }, signal: options.signal },
    ),
};
