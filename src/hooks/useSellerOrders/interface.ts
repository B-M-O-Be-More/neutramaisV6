import type { SellerOrderShippings } from "@/functions/sellerOrderSummary";
import type { ProductOrder } from "@/services/orders.service";
import type { SellerOrderStatus } from "@/types/sellerOrders";

/**
 * Resultado do aceite: `conflict` quando a orders-api recusa o estado do
 * pedido (pagamento não confirmado, cancelamento em andamento).
 */
export type SellerOrderAcceptResult =
  | "accepted"
  | "forbidden"
  | "conflict"
  | "failed";

export interface UseSellerOrdersReturn {
  /** Pedidos do Seller, do mais novo ao mais antigo. */
  orders: ProductOrder[];
  /** Envio dos pedidos físicos pagos, por id do pedido. */
  shippings: SellerOrderShippings;
  /** Pedidos por status, para os contadores das abas de filtro. */
  counts: Record<SellerOrderStatus, number>;
  /** Pedidos recebidos no mês corrente. */
  monthTotal: number;
  /** Pedidos com problema (cancelamento em disputa ou crédito pendente). */
  withIssue: number;
  /**
   * Pedidos aguardando aceite com menos de 8h de SLA. A orders-api ainda não
   * devolve o prazo de aceite: fica zero.
   */
  criticalSla: number;
  isLoading: boolean;
  /** Chave i18n do erro da última leitura; null sem erro. */
  errorKey: string | null;
  reload: () => void;
  /** Pedido com o aceite em andamento. */
  pendingId: string | null;
  /** Aceita o pedido físico pago (POST /shipping/accept). */
  accept: (orderId: string) => Promise<SellerOrderAcceptResult>;
}
