// Service do checkout do Buyer (orders-api, payment-api e frete do
// marketplace-api).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/*`), que anexa o Bearer da sessão de perfil
// Buyer — em 401, renova o perfil uma vez e repete.
//
// Ordem do fluxo (RN-TEL-01, NEU-589):
// 1. `quoteShipping` por produto físico, para o CEP de entrega;
// 2. `create` grava os pedidos (um por Seller e por lugar), com MFA;
// 3. `authorizeFunding` reserva o saldo da carteira e assina o comando;
// 4. `pay` cobra: o resto vai para o cartão no Stripe (`clientSecret`);
// 5. `paymentProgress` diz quando o pagamento terminou.

import { api } from "./api.client";
import type { CheckoutOrder } from "./orders.service";
import { withProfileSession } from "./profileSession.service";

export interface ShippingOption {
  /** Vai no checkout; `pickup` na retirada, `cargo` no frete do Seller. */
  serviceId: string;
  serviceName: string;
  carrier: { id: string | null; name: string | null; logoUrl: string | null };
  /** O que o Buyer paga, decimal em texto ("28.40"); null se indisponível. */
  buyerPrice: string | null;
  currency: "BRL";
  freeShipping: boolean;
  pickup: boolean;
  /** Postagem + transporte, em dias úteis. */
  totalDeliveryDays: { min: number | null; max: number | null };
}

export interface ShippingQuote {
  offeringId: string;
  postingDays: number;
  destinationPostalCode: string;
  quantity: number;
  /** melhor_envio, pickup ou to_be_agreed (frete combinado por RFQ). */
  provider: "melhor_envio" | "pickup" | "to_be_agreed";
  rfqRequired: boolean;
  /** Da mais barata para a mais cara. Vazia com `rfqRequired`. */
  options: ShippingOption[];
}

export interface ShippingAddress {
  recipient: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  country: "BR";
}

/** Item físico do checkout: frete escolhido e endereço de entrega. */
export interface PhysicalCheckoutItem {
  offeringId: string;
  expectedSnapshotVersion: string;
  quantity: number;
  serviceId: string;
  /** `buyerPrice` da opção escolhida, em centavos. */
  expectedShippingMinor: number;
  shippingAddress: ShippingAddress;
}

/** Item de serviço: evidência de viabilidade da Geo (D-01). */
export interface ServiceCheckoutItem {
  offeringId: string;
  expectedSnapshotVersion: string;
  quantity: number;
  evidenceId: string;
  flowId: string;
  point: { latitude: number; longitude: number };
}

export type CheckoutItem = PhysicalCheckoutItem | ServiceCheckoutItem;

export interface CreateCheckoutBody {
  items: CheckoutItem[];
  /** Saldo da carteira a usar, em centavos. */
  walletMinor: number;
}

export interface CheckoutApproval {
  status:
    | "withinLimit"
    | "awaitingApproval"
    | "approved"
    | "rejected"
    | "expired";
  expiresAt?: string | number | null;
}

export interface Checkout {
  checkoutId: string;
  buyerOrganizationId: string;
  currency: string;
  /** awaitingApproval só para Operações acima da alçada. */
  status: "awaitingPayment" | "awaitingApproval" | string;
  totalMinor: number;
  walletMinor: number;
  orders: CheckoutOrder[];
  approval?: CheckoutApproval;
}

export interface FundingAuthorization {
  checkoutId: string;
  /** JWT da orders-api para a payment-api. Vale 5 minutos. */
  authorization: string;
  /** Algum pedido precisa de cartão (total maior que a carteira). */
  externalPaymentRequired: boolean;
}

export interface CheckoutPayment {
  checkoutId: string;
  /** pending, confirmed, cancelled ou partially_cancelled. */
  status: "pending" | "confirmed" | "cancelled" | "partially_cancelled";
  paymentIntentId: string | null;
  /** Falha interna (ex.: Stripe fora): o status fica pending. */
  lastError: string | null;
  /** Só quando o cartão ainda precisa de ação no Stripe.js. */
  clientSecret?: string;
  /** A API não leu o PaymentIntent: repita com a mesma chave. */
  clientSecretUnavailable?: boolean;
}

export interface OperationProgress {
  operationId: string;
  status:
    | "running"
    | "waiting_external"
    | "action_required"
    | "pending_recovery"
    | "succeeded"
    | "cancelled"
    | "completed_with_cancellations";
  stage: string;
  terminal: boolean;
  /** Próxima consulta em segundos; null em estado final e em ação. */
  pollAfterSeconds: number | null;
}

const idempotency = (key: string) => ({ "Idempotency-Key": key });

export const checkoutService = {
  /** Cotação informativa de frete para o CEP (8 dígitos, com ou sem hífen). */
  quoteShipping: (
    offeringId: string,
    body: { destinationPostalCode: string; quantity: number },
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.post<ShippingQuote>(
        `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/shippingQuote`,
        body,
        { signal: options.signal },
      ),
    ),

  /**
   * Grava os pedidos. A mesma `idempotencyKey` repete a mesma compra (201).
   * 403 `MFA_REQUIRED` sem MFA na sessão; 409 com `code` quando oferta,
   * estoque, limite ou frete não conferem.
   */
  create: (body: CreateCheckoutBody, idempotencyKey: string) =>
    withProfileSession(() =>
      api.post<Checkout>("/orders/checkout", body, {
        headers: idempotency(idempotencyKey),
        timeoutMs: 60_000,
      }),
    ),

  get: (checkoutId: string) =>
    withProfileSession(() =>
      api.get<Checkout>(`/orders/checkout/${encodeURIComponent(checkoutId)}`),
    ),

  /** Progresso pela chave do POST: 404 enquanto o checkout não foi gravado. */
  progressByKey: (idempotencyKey: string) =>
    withProfileSession(() =>
      api.get<OperationProgress>("/orders/operations/checkout", {
        headers: idempotency(idempotencyKey),
      }),
    ),

  /** Reserva a carteira e assina o comando de pagamento (exige MFA). */
  authorizeFunding: (checkoutId: string) =>
    withProfileSession(() =>
      api.post<FundingAuthorization>(
        `/orders/checkout/${encodeURIComponent(checkoutId)}/fundingAuthorization`,
      ),
    ),

  /** Cobra o checkout: carteira primeiro, o resto no cartão. */
  pay: (
    body: { checkoutId: string; authorization: string },
    idempotencyKey: string,
  ) =>
    withProfileSession(() =>
      api.post<CheckoutPayment>("/payment", body, {
        headers: idempotency(idempotencyKey),
        timeoutMs: 60_000,
      }),
    ),

  paymentProgress: (checkoutId: string) =>
    withProfileSession(() =>
      api.get<OperationProgress>(
        `/payment/checkout/${encodeURIComponent(checkoutId)}/progress`,
      ),
    ),
};
