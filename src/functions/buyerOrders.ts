import { isCheckoutOrder, type ProductOrder } from "@/services/orders.service";

import { orderEscrowStatus, orderStage } from "./orderStage";

/** Indicadores do topo de "Meus Pedidos" (NEU-550). */
export interface BuyerOrdersSummary {
  total: number;
  /** Nem concluído, nem cancelado ou recusado. */
  inProgress: number;
  /** Dinheiro retido no escrow até a entrega ou a execução. */
  inEscrow: number;
  /** Cancelamento em andamento ou crédito ainda não devolvido na carteira. */
  inCancellation: number;
}

export function summarizeBuyerOrders(
  orders: ProductOrder[],
): BuyerOrdersSummary {
  let inProgress = 0;
  let inEscrow = 0;
  let inCancellation = 0;

  for (const order of orders) {
    const stage = orderStage(order);
    if (
      stage !== "completed" &&
      stage !== "cancelled" &&
      stage !== "rejected"
    ) {
      inProgress += 1;
    }
    if (orderEscrowStatus(order) === "held") inEscrow += 1;
    if (
      isCheckoutOrder(order) &&
      (order.cancellationStatus === "barrierPending" ||
        order.compensationStatus === "creditPending")
    ) {
      inCancellation += 1;
    }
  }

  return { total: orders.length, inProgress, inEscrow, inCancellation };
}

/** Nomes dos produtos do pedido (os dois formatos da orders-api). */
export function orderItemNames(order: ProductOrder): string[] {
  return isCheckoutOrder(order)
    ? order.items.map((item) => item.catalog.name)
    : order.items.map((item) => item.offeringName);
}

/**
 * Busca de "Meus Pedidos": produto, número do pedido (#E2B7D4A9) ou o
 * início do id do Seller, sem diferenciar maiúsculas.
 */
export function filterBuyerOrders(
  orders: ProductOrder[],
  query: string,
): ProductOrder[] {
  const term = query.trim().toLowerCase().replace(/^#/, "");
  if (!term) return orders;

  return orders.filter(
    (order) =>
      order.id.toLowerCase().startsWith(term) ||
      order.sellerOrganizationId.toLowerCase().startsWith(term) ||
      orderItemNames(order).some((name) => name.toLowerCase().includes(term)),
  );
}
