import type {
  AttachInvoiceInput,
  OrderShipping,
} from "@/services/orders.service";

/** Qual ação está em andamento (o id da etiqueta na impressão). */
export type SellerShippingPending =
  | "accept"
  | "invoice"
  | "tracking"
  | { label: string }
  | null;

/** Falha de uma ação: chave de tradução e, quando houver, o motivo da API. */
export interface SellerShippingFailure {
  errorKey: string;
  detail?: string;
}

export type SellerShippingResult =
  | { ok: true }
  | ({ ok: false } & SellerShippingFailure);

export interface UseSellerShippingActionsReturn {
  pending: SellerShippingPending;
  accept: () => Promise<SellerShippingResult>;
  attachInvoice: (input: AttachInvoiceInput) => Promise<SellerShippingResult>;
  informTracking: (code: string) => Promise<SellerShippingResult>;
  printLabel: (labelId: string) => Promise<SellerShippingResult>;
}

export interface UseSellerShippingActionsOptions {
  orderId: string;
  /** Recebe o envio atualizado depois de aceitar, anexar a NF ou o rastreio. */
  onShippingChange: (shipping: OrderShipping) => void;
}
