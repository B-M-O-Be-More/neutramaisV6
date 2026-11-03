import type { SellerShippingActions } from "@/functions/orderShipping";
import type { SellerShippingPending } from "@/hooks/useSellerShippingActions";
import type { OrderShipping, ProductOrder } from "@/services/orders.service";

/** Quem vê o pedido: a outra parte, os valores e as ações mudam. */
export type OrderPerspective = "buyer" | "seller";

/** Ações de envio do Seller no cartão da nota fiscal (pedido físico). */
export interface OrderDetailSellerShipping {
  actions: SellerShippingActions;
  pending: SellerShippingPending;
  onAccept: () => void;
  onAttachInvoice: () => void;
  onInformTracking: () => void;
  onPrintLabel: (labelId: string) => void;
}

export interface OrderDetailProps {
  order: ProductOrder;
  shipping: OrderShipping | null;
  perspective: OrderPerspective;
  locale: string;
  /** Volta para a lista de pedidos da área. */
  backHref: string;
  backLabel: string;
  /** Página de contratos da área (o Seller ainda não tem). */
  contractsHref?: string;
  isDownloadingInvoice: boolean;
  onDownloadInvoice: () => void;
  /** Só na visão do Seller: aceitar, anexar NF, etiquetas e rastreio. */
  sellerShipping?: OrderDetailSellerShipping;
}
