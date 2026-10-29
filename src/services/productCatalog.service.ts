// Service do catálogo de produtos (marketplace-api, TMF620).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/*`); os route handlers fazem proxy pra marketplace-api.

import type { PublicGeometry } from "@/functions/geoShapes";

import { api, RequestOptions } from "./api.client";

/**
 * Valor decimal em reais. O upstream serializa como número ou string decimal
 * (ex.: 1990 ou "1990.00") — normalize com `Number()` antes de formatar.
 */
export type DecimalValue = number | string;

/** Ciclo de vida da oferta. Toda oferta nasce `draft`; `archived` é terminal. */
export const OFFERING_STATUSES = [
  "draft",
  "published",
  "paused",
  "unpublished",
  "archived",
] as const;

export type OfferingStatus = (typeof OFFERING_STATUSES)[number];

/**
 * Transições do ciclo de vida (`POST /productOffering/{id}/{action}`).
 * - publish: draft | paused | unpublished → published (`offer:publish`; exige
 *   organização ativa, KYC verificado e cobertura vinculada)
 * - pause: published → paused (`offer:archive`)
 * - unpublish: published | paused → unpublished (`offer:archive`)
 * - archive: qualquer status não arquivado → archived (`offer:archive`)
 */
export const OFFERING_ACTIONS = [
  "publish",
  "pause",
  "unpublish",
  "archive",
] as const;

export type OfferingAction = (typeof OFFERING_ACTIONS)[number];

/** Oferta retornada pelas rotas de `/productCatalog/productOffering`. */
export interface ProductOffering {
  id: string;
  /** Incrementa a cada alteração. */
  revision?: number;
  organizationId: string;
  specificationId: string;
  name: string;
  monthlyPrice: DecimalValue;
  installationPrice: DecimalValue;
  /** Texto livre, ex.: "500 Mbps". Ausente em ofertas que não são de conectividade. */
  speed: string | null;
  durationMonths: number | null;
  /** Derivado do status: true só enquanto `published`. */
  isPublic: boolean;
  /** Presente nas rotas do seller (lista e detalhe). */
  status?: OfferingStatus;
  isCorporate: boolean;
  /** UF, duas letras (ex.: "SP"). */
  stateCode: string | null;
  isCapital: boolean | null;
  /** Versão de cobertura (KMZ) vinculada; obrigatória para publicar. */
  coverageVersionId?: string | null;
  /** Atributos livres definidos pela especificação (ex.: { ipFixo: true }). */
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  /** Oferta patrocinada (destaque pago). */
  isPromoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Contadores do catálogo do seller — `GET /productOffering/summary`. */
export interface OfferingsSummary {
  totalOffers: number;
  byStatus: Record<OfferingStatus, number>;
  withCoverage: number;
  withoutCoverage: number;
  promoted: number;
  /** Decimais com 2 casas; null quando a organização não tem ofertas. */
  averageMonthlyPrice: DecimalValue | null;
  minMonthlyPrice: DecimalValue | null;
  maxMonthlyPrice: DecimalValue | null;
}

/**
 * Especificação de produto da organização (`GET /productSpecification`). É a
 * "categoria" da oferta na interface — cada seller define as suas.
 */
export interface ProductSpecification {
  id: string;
  organizationId: string;
  catalogId: string;
  name: string;
  description: string | null;
  estimatedInstallationDays: number | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Catálogo da organização (`GET /catalog`). */
export interface ProductCatalog {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Corpo de `POST /productSpecification`. */
export interface CreateSpecificationInput {
  name: string;
  description?: string | null;
  estimatedInstallationDays?: number | null;
  capacity?: number | null;
}

/** Corpo de `POST /productOffering` — a oferta nasce `draft`. */
export interface CreateOfferingInput {
  name: string;
  specificationId: string;
  /** Decimal com 2 casas, maior que zero (ex.: "1890.00"). */
  monthlyPrice: string;
  /** Decimal com 2 casas, a partir de zero. */
  installationPrice?: string;
  /** Texto livre, ex.: "500 Mbps". */
  speed?: string | null;
  durationMonths?: 1 | 3 | 6 | 12 | 24 | 36 | 48 | 60;
  isCorporate?: boolean;
  stateCode?: string | null;
  isCapital?: boolean;
  /** Atributos livres da oferta (guardados sem validação de esquema). */
  metadata?: Record<string, unknown> | null;
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

/**
 * Paginação (por deslocamento) e filtros de `GET /productCatalog/productOffering`,
 * combinados por AND.
 */
export interface ListOrganizationOfferingsParams {
  /** Quantos itens pular. Começa em 0. */
  offset?: number;
  /** Tamanho da página (1–200; default 50 no upstream). */
  limit?: number;
  status?: OfferingStatus;
  /** Parte do nome, sem diferenciar maiúsculas. */
  name?: string;
  specificationId?: string;
}

/** Corpo de `PATCH /productOffering/{id}` — só os campos alterados. */
export type UpdateOfferingInput = Partial<CreateOfferingInput>;

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

  /** Detalhe de uma oferta da organização (403 de outra, 404 inexistente). */
  getOffering: (
    offeringId: string,
    options: Pick<RequestOptions, "signal"> = {},
  ) =>
    api.get<ProductOffering>(
      `/productCatalog/productOffering/${encodeURIComponent(offeringId)}`,
      { signal: options.signal },
    ),

  /**
   * Edita a oferta. Campos ausentes ficam como estão; arquivadas são só
   * leitura (409).
   */
  updateOffering: (offeringId: string, input: UpdateOfferingInput) =>
    api.patch<ProductOffering>(
      `/productCatalog/productOffering/${encodeURIComponent(offeringId)}`,
      input,
    ),

  /** Contadores do catálogo da organização do usuário logado. */
  getOfferingsSummary: (options: Pick<RequestOptions, "signal"> = {}) =>
    api.get<OfferingsSummary>("/productCatalog/productOffering/summary", {
      signal: options.signal,
    }),

  /** Especificações de produto da organização do usuário logado (sem paginação). */
  listSpecifications: (options: Pick<RequestOptions, "signal"> = {}) =>
    api.get<ProductSpecification[]>("/productCatalog/productSpecification", {
      signal: options.signal,
    }),

  /**
   * Catálogo da organização. A API cria um ("Default Catalog") na primeira
   * leitura — criar especificação exige que ele exista.
   */
  getCatalog: () => api.get<ProductCatalog>("/productCatalog/catalog"),

  /** Cria um plano (especificação) no catálogo da organização. */
  createSpecification: (input: CreateSpecificationInput) =>
    api.post<ProductSpecification>(
      "/productCatalog/productSpecification",
      input,
    ),

  /**
   * Cria a oferta sempre como `draft`. 403 `MKT_SELLER_NOT_APPROVED` com a
   * organização não ativa; 404 quando a especificação não existe.
   */
  createOffering: (input: CreateOfferingInput) =>
    api.post<ProductOffering>("/productCatalog/productOffering", input),

  /**
   * Vincula uma versão de cobertura (KMZ) à oferta. Exige `coverage:change`;
   * qualquer falha da geo-api volta como 503. `publicGeometry` restringe a
   * área pública a polígonos dentro do KMZ ("Cobertura editada").
   */
  bindCoverage: (
    offeringId: string,
    coverageVersionId: string,
    publicGeometry?: PublicGeometry | null,
  ) =>
    api.put<{ offeringId: string; coverageVersionId: string }>(
      `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/coverageVersion`,
      publicGeometry
        ? { coverageVersionId, publicGeometry }
        : { coverageVersionId },
    ),

  /** Liga/desliga o patrocínio da oferta. Exige `offer:promote`. */
  setPromotion: (offeringId: string, isPromoted: boolean) =>
    api.put<ProductOffering>(
      `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/promotion`,
      { isPromoted },
    ),

  /**
   * Aplica uma transição do ciclo de vida e devolve a oferta atualizada.
   * 403 sem permissão ou sem aprovação/KYC; 409 quando o status atual não
   * permite a transição ou falta cobertura para publicar.
   */
  transitionOffering: (offeringId: string, action: OfferingAction) =>
    api.post<ProductOffering>(
      `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/${action}`,
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
