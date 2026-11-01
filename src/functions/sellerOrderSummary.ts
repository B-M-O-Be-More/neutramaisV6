import { orderHasPhysicalItems } from "@/functions/orderStage";
import {
  isCheckoutOrder,
  type OrderShipping,
  type ProductOrder,
} from "@/services/orders.service";
import {
  SELLER_ORDER_STATUSES,
  type SellerOrderStatus,
} from "@/types/sellerOrders";

/** Envio dos pedidos físicos pagos, por id do pedido. */
export type SellerOrderShippings = Record<string, OrderShipping>;

/**
 * Pedido físico pago que ainda espera o aceite do Seller (RN-LOG-02). É o
 * único aceite que a orders-api tem; serviço segue pelo contrato.
 */
export function sellerOrderNeedsShippingAccept(
  order: ProductOrder,
  shipping: OrderShipping | undefined,
): boolean {
  return (
    isCheckoutOrder(order) &&
    order.status === "accepted" &&
    orderHasPhysicalItems(order) &&
    !!shipping &&
    !shipping.accepted
  );
}

/**
 * Aba da caixa de entrada de um pedido. A orders-api tem dois formatos:
 * - checkout: `awaitingPayment` aguarda o Buyer; pago e físico, aguarda o
 *   aceite do envio; `cancelled` com a reserva vencida é expirado, os outros
 *   cancelados entram em "Recusados";
 * - antigo: `pending` aguarda o aceite; `completed` conta como aceito.
 */
export function sellerOrderStatus(
  order: ProductOrder,
  shipping?: OrderShipping,
): SellerOrderStatus {
  if (isCheckoutOrder(order)) {
    if (order.status === "awaitingPayment") return "awaiting";
    if (order.status === "accepted") {
      return sellerOrderNeedsShippingAccept(order, shipping)
        ? "awaiting"
        : "accepted";
    }
    return order.reservationStatus === "expired" ? "expired" : "rejected";
  }
  if (order.status === "pending") return "awaiting";
  if (order.status === "accepted" || order.status === "completed") {
    return "accepted";
  }
  return "rejected";
}

/** Data de criação: segundos Unix (checkout) ou ISO 8601 (antigo). */
export function sellerOrderCreatedAt(order: ProductOrder): Date | null {
  if (order.createdAt === null) return null;
  const date =
    typeof order.createdAt === "number"
      ? new Date(order.createdAt * 1000)
      : new Date(order.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Cancelamento em andamento ou recusado, ou crédito ainda não devolvido. */
export function hasSellerOrderIssue(order: ProductOrder): boolean {
  return (
    isCheckoutOrder(order) &&
    (order.cancellationStatus === "barrierPending" ||
      order.cancellationStatus === "barrierRejected" ||
      order.compensationStatus === "creditPending")
  );
}

export interface SellerOrdersSummary {
  counts: Record<SellerOrderStatus, number>;
  /** Pedidos criados no mês de `now`. */
  monthTotal: number;
  withIssue: number;
}

export function summarizeSellerOrders(
  orders: ProductOrder[],
  now: Date = new Date(),
  shippings: SellerOrderShippings = {},
): SellerOrdersSummary {
  const counts = Object.fromEntries(
    SELLER_ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<SellerOrderStatus, number>;
  let monthTotal = 0;
  let withIssue = 0;

  for (const order of orders) {
    counts[sellerOrderStatus(order, shippings[order.id])] += 1;
    const createdAt = sellerOrderCreatedAt(order);
    if (
      createdAt &&
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth()
    ) {
      monthTotal += 1;
    }
    if (hasSellerOrderIssue(order)) withIssue += 1;
  }

  return { counts, monthTotal, withIssue };
}

/** Nomes das ofertas do pedido, na ordem das linhas. */
export function sellerOrderProductNames(order: ProductOrder): string[] {
  return isCheckoutOrder(order)
    ? order.items.map((item) => item.catalog.name)
    : order.items.map((item) => item.offeringName);
}

/** O pedido tem alguma linha da especificação (categoria) informada. */
export function sellerOrderHasSpecification(
  order: ProductOrder,
  specification: { id: string; name: string },
): boolean {
  return isCheckoutOrder(order)
    ? order.items.some(
        (item) => item.catalog.specification?.id === specification.id,
      )
    : order.items.some((item) => item.specificationName === specification.name);
}
