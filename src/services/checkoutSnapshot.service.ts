// Service do snapshot de checkout (marketplace-api).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/productCatalog/*`), que anexa o Bearer da
// sessão de perfil Buyer — em 401, renova o perfil uma vez e repete.
//
// O snapshot é a oferta como o checkout a cobra: o carrinho lê preço, moeda,
// estoque e prazo dele, e o `snapshotVersion` vai no pedido (a orders-api
// recusa com 409 se a oferta mudou). Dinheiro em decimal, como texto.

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

export interface SnapshotPrice {
  id: string;
  /** recurring: por período (1º período no checkout); os outros, únicos. */
  priceType: "recurring" | "one_time" | "full_purchase";
  currency: string;
  /** Decimal exato, ex.: "2490.00". */
  amount: string;
  /** "month" no recorrente. */
  recurringPeriod: string | null;
  /** Faixa de quantidade que este preço cobre. */
  minQuantity: number;
  maxQuantity: number | null;
}

/** `GET /productOffering/{id}/checkoutSnapshot?schemaVersion=2`. */
export interface CheckoutSnapshot {
  schemaVersion: 2;
  offeringId: string;
  sellerOrganizationId: string;
  revision: number;
  snapshotVersion: string;
  name: string;
  /** `rfq`: sob consulta — não entra no carrinho. */
  pricingMode: "fixed" | "rfq";
  currency: string | null;
  prices: SnapshotPrice[];
  durationMonths: number | null;
  speed: string | null;
  productType?: "service" | "physical";
  /** null = sem controle de estoque. */
  stockQuantity: number | null;
  /** null = sem limite por organização. */
  purchaseLimitPerAccount: number | null;
  specification: {
    id: string;
    name: string;
    estimatedInstallationDays: number | null;
  } | null;
  /** Pacote de envio do produto físico (`postingDays`: dias para postar). */
  shipping: { postingDays?: number } | null;
}

export const checkoutSnapshotService = {
  /**
   * Snapshot de uma oferta à venda. 403 na oferta da própria organização;
   * 404 quando a oferta saiu de venda.
   */
  get: (offeringId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<CheckoutSnapshot>(
        `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/checkoutSnapshot`,
        { signal: options.signal },
      ),
    ),
};
