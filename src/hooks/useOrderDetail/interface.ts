import type { OrderShipping, ProductOrder } from "@/services/orders.service";

export interface UseOrderDetailReturn {
  order: ProductOrder | null;
  /** Envio (só pedido com produto físico); null sem envio ou em falha. */
  shipping: OrderShipping | null;
  isLoading: boolean;
  /** Chave i18n do erro da leitura do pedido; null sem erro. */
  errorKey: string | null;
  reload: () => void;
  /** Troca o envio pelo que a orders-api devolveu numa ação do Seller. */
  setShipping: (shipping: OrderShipping) => void;
}
