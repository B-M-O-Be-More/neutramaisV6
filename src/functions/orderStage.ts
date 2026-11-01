import { isCheckoutOrder, type ProductOrder } from "@/services/orders.service";

/** Etapa do pedido como a tela de detalhe mostra (status e progresso). */
export type OrderStage =
  | "awaitingPayment"
  | "awaitingAcceptance"
  | "awaitingContract"
  | "inExecution"
  | "completed"
  | "cancelled"
  | "rejected";

/** Passos da barra "Progresso do pedido" (Figma 2191-17835). */
export const ORDER_PROGRESS_STEPS = [
  "created",
  "paid",
  "accepted",
  "inExecution",
] as const;

export type OrderProgressStep = (typeof ORDER_PROGRESS_STEPS)[number];

export type OrderStageTone = "warning" | "success" | "danger";

export function orderHasPhysicalItems(order: ProductOrder): boolean {
  return (
    isCheckoutOrder(order) &&
    order.items.some((item) => item.catalog.productType === "physical")
  );
}

/**
 * Checkout: o pagamento confirmado aceita o pedido; o serviço só entra em
 * execução depois do contrato assinado (`executionReleased`), o físico segue
 * para o envio. Antigo: `pending` espera o aceite do Seller.
 */
export function orderStage(order: ProductOrder): OrderStage {
  if (isCheckoutOrder(order)) {
    if (order.status === "awaitingPayment") return "awaitingPayment";
    if (order.status === "cancelled") return "cancelled";
    return order.executionReleased || orderHasPhysicalItems(order)
      ? "inExecution"
      : "awaitingContract";
  }
  if (order.status === "pending") return "awaitingAcceptance";
  if (order.status === "accepted") return "inExecution";
  return order.status;
}

export function orderStageTone(stage: OrderStage): OrderStageTone {
  if (stage === "cancelled" || stage === "rejected") return "danger";
  if (stage === "inExecution" || stage === "completed") return "success";
  return "warning";
}

/**
 * Quantos passos já foram concluídos e qual é o atual (null quando o pedido
 * terminou ou foi encerrado sem concluir).
 */
export function orderProgress(stage: OrderStage): {
  done: number;
  current: number | null;
} {
  switch (stage) {
    case "awaitingPayment":
      return { done: 1, current: 1 };
    case "awaitingAcceptance":
      return { done: 2, current: 2 };
    case "awaitingContract":
    case "inExecution":
      return { done: 3, current: 3 };
    case "completed":
      return { done: ORDER_PROGRESS_STEPS.length, current: null };
    default:
      return { done: 1, current: null };
  }
}

/** Situação do dinheiro do pedido no escrow (chave de `OrderDetail.escrow`). */
export function orderEscrowStatus(order: ProductOrder): string | null {
  if (!isCheckoutOrder(order)) return null;
  if (order.compensationStatus === "creditedToWallet") return "refunded";
  if (order.compensationStatus === "creditPending") return "refundPending";
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "awaitingPayment") return "awaitingPayment";
  return "held";
}

/** Data de criação: segundos Unix (checkout) ou ISO 8601 (antigo). */
export function orderDate(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const date =
    typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
