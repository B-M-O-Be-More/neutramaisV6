import type { ProductOrder } from "@/services/orders.service";

export interface UseBuyerOrdersReturn {
  /** Pedidos do Buyer, do mais novo ao mais antigo. */
  orders: ProductOrder[];
  isLoading: boolean;
  /** Chave i18n do erro; null sem erro. */
  errorKey: string | null;
  reload: () => void;
}
