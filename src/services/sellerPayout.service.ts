// Service dos recebimentos do seller (payment-api).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/payment/*`), que anexa o Bearer da sessão de
// perfil Seller — em 401, renova o perfil uma vez e repete.
//
// Valores sempre em unidades mínimas (centavos) e inteiros.

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

// O upstream não pagina: até 1000 itens por leitura.
const MAX_ITEMS = 1000;

/** Recebível de um pedido pago — `GET /payment/seller/receivables`. */
export interface SellerReceivable {
  allocationId: string;
  orderId: string;
  sellerOrganizationId: string;
  /** ISO 4217. */
  currency: string;
  /** Pago pelo Buyer. */
  grossMinor: number;
  /** Retenção da plataforma (taxas e, em pedido físico, frete). */
  feeMinor: number;
  /** Líquido do Seller (`grossMinor - feeMinor`). */
  netMinor: number;
  /** Pode entrar no próximo repasse (confirmado, sem cancelamento, entregue). */
  eligible: boolean;
  /** Lote de repasse que recebeu o valor; null se ainda não entrou. */
  batchId: string | null;
  cancellationId: string | null;
}

/** Dívida de frete — `GET /payment/seller/shippingCostDebts`. */
export interface ShippingCostDebt {
  reference: string;
  orderId: string;
  sellerOrganizationId: string;
  currency: string;
  /** Sempre maior que 0. */
  amountMinor: number;
  eventId: string;
  occurredAt: string;
  status: "recorded";
  /** Sempre false: o valor não sai do repasse. */
  automaticallyDeducted: boolean;
}

export const sellerPayoutService = {
  /** Recebíveis do Seller. 403 sem `payment:read`. */
  listReceivables: (options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<SellerReceivable[]>("/payment/seller/receivables", {
        params: { limit: MAX_ITEMS },
        signal: options.signal,
      }),
    ),

  /** Dívidas de frete do Seller. 403 sem `payment:read`. */
  listShippingCostDebts: (options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<ShippingCostDebt[]>("/payment/seller/shippingCostDebts", {
        params: { limit: MAX_ITEMS },
        signal: options.signal,
      }),
    ),
};
