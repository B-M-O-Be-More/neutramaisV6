import type { OrderShipping, ProductOrder } from "@/services/orders.service";

/** Quem vê o pedido: a outra parte, os valores e as ações mudam. */
export type OrderPerspective = "buyer" | "seller";

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
}
