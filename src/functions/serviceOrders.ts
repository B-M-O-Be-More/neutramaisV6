// Regras de exibição das ordens de serviço do seller: status de negócio,
// contadores, busca, evidências e o progresso TMF641.

import type { ServiceOrderItemDisplayStatus } from "@/data/serviceOrderStatus";
import type {
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrdersSummary,
} from "@/types/serviceOrders";

const DAY = 24 * 60 * 60 * 1000;

/** Etapas do "Progresso TMF641" do detalhe (Figma 2968-72795). */
export const SERVICE_ORDER_PROGRESS_STEPS = [
  "acknowledged",
  "pending",
  "inProgress",
  "completed",
] as const;

/** Status exibido da ordem: cancelada com crédito vira "Creditado". */
export function serviceOrderDisplayStatus(order: ServiceOrder) {
  return order.status === "cancelled" && order.creditIssued
    ? "credited"
    : order.status;
}

/** Status exibido da demanda: "Adiada" enquanto aguarda a nova previsão. */
export function serviceOrderItemDisplayStatus(
  item: ServiceOrderItem,
): ServiceOrderItemDisplayStatus {
  return item.postponedTo &&
    (item.status === "pending" || item.status === "held")
    ? "postponed"
    : item.status;
}

export function summarizeServiceOrders(
  orders: ServiceOrder[],
): ServiceOrdersSummary {
  return {
    total: orders.length,
    inProgress: orders.filter((order) => order.status === "inProgress").length,
    awaiting: orders.filter((order) => order.status === "pending").length,
    withIssue: orders.filter(
      (order) =>
        order.status === "held" ||
        order.status === "rejected" ||
        order.items.some((item) => item.jeopardy),
    ).length,
  };
}

export function summarizeServiceOrderItems(
  items: ServiceOrderItem[],
): ServiceOrdersSummary {
  return {
    total: items.length,
    inProgress: items.filter((item) => item.status === "inProgress").length,
    awaiting: items.filter((item) => item.status === "pending").length,
    withIssue: items.filter((item) => item.status === "held" || item.jeopardy)
      .length,
  };
}

/** Busca sem acento nem caixa em qualquer um dos textos. */
export function matchesServiceOrderSearch(
  texts: (string | undefined)[],
  query: string,
): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const needle = normalize(query.trim());
  if (!needle) return true;
  return texts.some((text) => text && normalize(text).includes(needle));
}

/** Evidências registradas, obrigatórias e o percentual concluído. */
export function serviceOrderEvidenceProgress(item: ServiceOrderItem) {
  const total = item.evidences.length;
  const done = item.evidences.filter((evidence) => evidence.fileName).length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

/**
 * "Concluir OS" só com todas as evidências obrigatórias registradas
 * (regras §11 — a conclusão final ainda depende do aceite do buyer).
 */
export function canCompleteServiceOrderItem(item: ServiceOrderItem): boolean {
  const { done, total } = serviceOrderEvidenceProgress(item);
  return item.status === "inProgress" && done === total;
}

/**
 * A OS fica pendente até ter um técnico da equipe do seller (Figma
 * 2191-21596) — mesmo a execução digital tem um responsável.
 */
export function canStartServiceOrderItem(item: ServiceOrderItem): boolean {
  return item.status === "pending" && !!item.technician;
}

/** Reagendamentos ainda permitidos ("Reagendar (3 restantes)"). */
export function remainingReschedules(item: ServiceOrderItem): number {
  return Math.max(item.reschedulesAllowed - item.reschedulesUsed, 0);
}

/**
 * Etapa atual no progresso TMF641: as anteriores ficam concluídas. Concluída
 * marca todas; em espera fica na execução.
 */
export function serviceOrderProgressIndex(item: ServiceOrderItem): number {
  switch (item.status) {
    case "pending":
      return 1;
    case "inProgress":
    case "held":
      return 2;
    case "completed":
      return SERVICE_ORDER_PROGRESS_STEPS.length;
    default:
      return 0;
  }
}

/** Dias inteiros desde a data (0 se no futuro ou inválida). */
export function daysSince(iso: string, now: number): number {
  const diff = now - new Date(iso).getTime();
  return Number.isFinite(diff) && diff > 0 ? Math.floor(diff / DAY) : 0;
}

/** Dias inteiros até a data, arredondados para cima (0 se já passou). */
export function daysUntil(iso: string, now: number): number {
  const diff = new Date(iso).getTime() - now;
  return Number.isFinite(diff) && diff > 0 ? Math.ceil(diff / DAY) : 0;
}
