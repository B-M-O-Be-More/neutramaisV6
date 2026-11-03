// Service dos pedidos (orders-api, TMF622 Product Order).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/orders/*`), que anexa o Bearer da sessão de
// perfil (Seller na caixa de entrada, Buyer em /orders) — em 401, renova o
// perfil uma vez e repete. A orders-api exige `order:read` no perfil.

import { api } from "./api.client";
import { withProfileSession } from "./profileSession.service";

/** Linha de um pedido do checkout (só os campos que a tela lê). */
export interface CheckoutOrderItem {
  catalog: {
    offeringId: string;
    name: string;
    productType?: "service" | "physical";
    specification?: { id: string; name: string } | null;
    /** Só físico. `automaticTracking: false` libera o rastreio manual. */
    shippingPolicy?: { automaticTracking?: boolean } | null;
    /** Só físico. CEP de origem da cotação (8 dígitos). */
    shippingPackage?: { originPostalCode?: string | null } | null;
  };
  quantity: number;
  /** Total da linha em centavos da moeda do pedido. */
  totalMinor: number;
  /** Valor só dos produtos da linha (sem frete), em centavos. */
  productSubtotalMinor?: number;
  /** Só físico: entrega, frete grátis ou retirada (sem etiqueta). */
  shippingMode?: "delivery" | "free" | "pickup";
}

/** Pedido criado pelo checkout atual. */
export interface CheckoutOrder {
  id: string;
  orderId: string;
  checkoutId: string;
  /** Segundos Unix (UTC). */
  createdAt: number | null;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  status: "awaitingPayment" | "accepted" | "cancelled";
  items: CheckoutOrderItem[];
  /** Total do pedido em centavos da `currency` (o que o Buyer paga). */
  totalMinor: number;
  /** Parte paga com o saldo da carteira. */
  walletMinor: number;
  /** Parte paga fora da carteira (cartão). */
  cardMinor: number;
  /** Valor que a plataforma retém do total. */
  platformFeeMinor: number;
  currency: string;
  /** Cópia imutável do checkout; `platformFeeBps` é a taxa em pontos-base. */
  snapshot?: { platformFeeBps?: number };
  /** Contrato assinado (só pedido de serviço). */
  contractId: string | null;
  /** O contrato assinado liberou a execução do serviço. */
  executionReleased: boolean;
  /** Valor capturado (carteira + cartão). */
  paidMinor: number;
  /** Valor devolvido na carteira do Buyer. */
  creditedMinor: number;
  /** `expired`: o Buyer não pagou dentro da reserva (15 min). */
  reservationStatus:
    | "not_required"
    | "pending"
    | "reserved"
    | "released"
    | "expired";
  /** `barrierPending`: cancelamento em andamento. */
  cancellationStatus:
    | "not_requested"
    | "barrierPending"
    | "barrierRejected"
    | "cancelled";
  compensationStatus: "not_required" | "creditPending" | "creditedToWallet";
}

/** Linha de um pedido antigo (valores em reais, não centavos). */
export interface LegacyOrderItem {
  id: string;
  offeringId: string;
  offeringName: string;
  specificationName: string | null;
  monthlyPrice: number;
  installationPrice: number;
  quantity: number;
}

/** Pedido anterior ao checkout atual (tabela `product_orders`). */
export interface LegacyOrder {
  id: string;
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  items: LegacyOrderItem[];
  totalMonthly: number;
  totalInstallation: number;
  /** ISO 8601 com fuso. */
  createdAt: string | null;
  /** Última mudança (ISO 8601); só na leitura de um pedido. */
  updatedAt?: string | null;
  note?: string | null;
  rejectionReason?: string | null;
}

/** Envio de um pedido com produto físico (`GET /{id}/shipping`). */
export interface OrderShipping {
  orderId: string;
  revision: number;
  /** O Seller aceitou o pedido (ou a oferta tem aceite automático). */
  accepted: boolean;
  /** A NF em PDF está anexada. */
  invoiceAttached: boolean;
  /** Chave de acesso da NF (44 dígitos). */
  invoiceKey: string | null;
  /** O Buyer confirmou o recebimento. */
  received: boolean;
  /** Rastreio informado pelo Seller (manual). */
  tracking: string | null;
  labels: OrderShippingLabel[];
}

/** Etiqueta do Melhor Envio: uma por linha com entrega. */
export interface OrderShippingLabel {
  id: string;
  offeringId?: string;
  /**
   * `pending`, `cart`, `paid`, `ready` (pronta para imprimir), `cancelled`,
   * ou com sufixo `_unknown` quando o resultado no Melhor Envio é incerto.
   */
  status: string;
  tracking: string | null;
  attempts?: number;
  /** Resultado incerto ou falha na última tentativa: o Financeiro trata. */
  attentionRequired?: boolean;
}

/** Remetente da NF: o Seller que emite. Campos no formato da orders-api. */
export interface InvoiceSender {
  name: string;
  /** CNPJ (14 dígitos), igual ao da chave de acesso. */
  company_document: string;
  state_register: string;
  /** CEP de origem da cotação (8 dígitos). */
  postal_code: string;
  address: string;
  number: string;
  district: string;
  city: string;
  state_abbr: string;
  phone: string;
  email: string;
  complement?: string;
  economic_activity_code?: string | null;
}

/** Corpo do "Anexar nota fiscal" (PDF em Base64, até 2 MiB). */
export interface AttachInvoiceInput {
  pdfBase64: string;
  /** Chave de acesso da NF-e (44 dígitos). */
  accessKey: string;
  /** Soma dos produtos das linhas físicas, sem frete e sem taxas. */
  valueMinor: number;
  sender: InvoiceSender;
  /** CPF ou CNPJ do Buyer, sem máscara. */
  recipientDocument: string;
  recipientEmail: string;
  recipientPhone: string;
}

/**
 * Pedido da lista: os dois formatos chegam juntos em `data`. Só o do checkout
 * tem `checkoutId`.
 */
export type ProductOrder = CheckoutOrder | LegacyOrder;

export function isCheckoutOrder(order: ProductOrder): order is CheckoutOrder {
  return "checkoutId" in order;
}

export interface ListOrdersParams {
  /** Quantos pedidos pular (0 a 10000). Use múltiplo de `limit`. */
  offset?: number;
  /** Tamanho da página (1 a 200; padrão 50 no upstream). */
  limit?: number;
}

export const ordersService = {
  /**
   * Pedidos em que a organização do perfil é o Buyer, do mais novo ao mais
   * antigo. `metadata` traz a paginação. 403 sem `order:read`.
   */
  listBuyerOrders: (
    { offset, limit }: ListOrdersParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.request<ProductOrder[]>("GET", "/orders/buyer", null, {
        params: { offset, limit },
        signal: options.signal,
      }),
    ),

  /**
   * Pedidos em que a organização do perfil é o Seller, do mais novo ao mais
   * antigo. `metadata` traz a paginação. 403 sem `order:read`.
   */
  listSellerOrders: (
    { offset, limit }: ListOrdersParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    withProfileSession(() =>
      api.request<ProductOrder[]>("GET", "/orders/seller", null, {
        params: { offset, limit },
        signal: options.signal,
      }),
    ),

  /**
   * Um pedido, para o Buyer ou o Seller dele. 403 de outra organização ou sem
   * `order:read`; 404 quando não existe.
   */
  getOrder: (orderId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<ProductOrder>(`/orders/${encodeURIComponent(orderId)}`, {
        signal: options.signal,
      }),
    ),

  /** Envio do pedido com produto físico (NF, etiquetas, rastreio). */
  getShipping: (orderId: string, options: { signal?: AbortSignal } = {}) =>
    withProfileSession(() =>
      api.get<OrderShipping>(
        `/orders/${encodeURIComponent(orderId)}/shipping`,
        { signal: options.signal },
      ),
    ),

  /**
   * O Seller aceita o pedido físico pago (`order:accept`). Devolve o envio
   * atualizado; 409 quando o pagamento ainda não foi confirmado.
   */
  acceptShipping: (orderId: string) =>
    withProfileSession(() =>
      api.post<OrderShipping>(
        `/orders/${encodeURIComponent(orderId)}/shipping/accept`,
      ),
    ),

  /** PDF da nota fiscal. 404 enquanto o Seller não anexou. */
  downloadInvoice: (orderId: string) =>
    withProfileSession(() =>
      api.getBlob(`/orders/${encodeURIComponent(orderId)}/shipping/invoice`),
    ),

  /**
   * O Seller anexa (ou troca, até a etiqueta começar a ser comprada) a NF do
   * pedido físico aceito (`order:accept`). Devolve o envio atualizado; 422
   * com o motivo quando a chave, o valor ou o PDF não conferem.
   */
  attachInvoice: (orderId: string, input: AttachInvoiceInput) =>
    withProfileSession(() =>
      api.post<OrderShipping>(
        `/orders/${encodeURIComponent(orderId)}/shipping/invoice`,
        input,
      ),
    ),

  /**
   * Rastreio manual (`order:accept`): pedido pago, aceito, com NF e oferta
   * sem rastreio automático. Cada chamada troca o código.
   */
  informTracking: (orderId: string, code: string) =>
    withProfileSession(() =>
      api.post<OrderShipping>(
        `/orders/${encodeURIComponent(orderId)}/shipping/tracking`,
        { code },
      ),
    ),

  /** PDF da etiqueta `ready` (`order:accept`), lido na hora do Melhor Envio. */
  downloadLabel: (orderId: string, labelId: string) =>
    withProfileSession(() =>
      api.getBlob(
        `/orders/${encodeURIComponent(orderId)}/shipping/labels/${encodeURIComponent(labelId)}`,
      ),
    ),
};
