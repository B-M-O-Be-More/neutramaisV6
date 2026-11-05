import type { ProductOrder } from "@/services/orders.service";

export interface BuyerOrderCardProps {
  order: ProductOrder;
  /** Página do detalhe do pedido. */
  href: string;
  locale: string;
}
