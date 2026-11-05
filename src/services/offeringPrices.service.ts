// Service dos preços da oferta (marketplace-api
// `/productOffering/{id}/price`, TMF620 ProductOfferingPrice): faixas de
// quantidade, histórico e moeda única por oferta.
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF, que anexa o Bearer da sessão de perfil Seller.

import { api } from "./api.client";
import type { ProductOffering } from "./productCatalog.service";
import { withProfileSession } from "./profileSession.service";

/** `recurring` (mensal), `one_time` (instalação/taxa) ou `full_purchase` (à vista). */
export type OfferingPriceType = "recurring" | "one_time" | "full_purchase";

export const OFFERING_PRICE_TYPES: OfferingPriceType[] = [
  "recurring",
  "one_time",
  "full_purchase",
];

/** Preço da oferta. Cada alteração cria um ID novo. */
export interface OfferingPrice {
  id: string;
  priceType: OfferingPriceType;
  /** ISO 4217. */
  currency: string;
  /** Decimal com 2 casas (ex.: "189.90"). */
  amount: string;
  /** `month` em `recurring`; null nos outros tipos. */
  recurringPeriod: "month" | null;
  /** Início da faixa de quantidade. */
  minQuantity: number;
  /** Fim da faixa (inclusivo); null sem fim. */
  maxQuantity: number | null;
  validFrom: string;
  /** null em preço ativo. */
  validTo: string | null;
}

/** Corpo de `POST /price`. */
export interface CreateOfferingPriceInput {
  priceType: OfferingPriceType;
  currency: string;
  amount: string;
  recurringPeriod?: "month";
  minQuantity?: number;
  maxQuantity?: number | null;
}

/** Corpo de `PATCH /price/{id}`: só o que muda. */
export type UpdateOfferingPriceInput = Partial<
  Pick<
    CreateOfferingPriceInput,
    "currency" | "amount" | "minQuantity" | "maxQuantity"
  >
>;

const pricePath = (offeringId: string, priceId?: string) =>
  `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/price${
    priceId ? `/${encodeURIComponent(priceId)}` : ""
  }`;

export const offeringPricesService = {
  /** Preços ativos; com `history`, também os encerrados. */
  list: (
    offeringId: string,
    options: { history?: boolean; signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.get<OfferingPrice[]>(pricePath(offeringId), {
        params: options.history ? { history: true } : undefined,
        signal: options.signal,
      }),
    ),

  /** Adiciona um preço. Devolve a oferta inteira, com `prices` atualizado. */
  create: (offeringId: string, input: CreateOfferingPriceInput) =>
    withProfileSession(() =>
      api.post<ProductOffering>(pricePath(offeringId), input),
    ),

  /** Altera um preço ativo (a API encerra o atual e cria outro). */
  update: (
    offeringId: string,
    priceId: string,
    input: UpdateOfferingPriceInput,
  ) =>
    withProfileSession(() =>
      api.patch<ProductOffering>(pricePath(offeringId, priceId), input),
    ),

  /** Encerra um preço ativo (fica no histórico). */
  end: (offeringId: string, priceId: string) =>
    withProfileSession(() =>
      api.delete<ProductOffering>(pricePath(offeringId, priceId)),
    ),
};
