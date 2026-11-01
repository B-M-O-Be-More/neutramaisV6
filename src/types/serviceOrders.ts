// Ordens de serviço do seller (TMF641 Service Ordering). Uma ordem nasce do
// pedido aceito e pago (regras de negócio §11) e reúne as demandas — os itens
// da ordem — que o seller executa, cada uma com técnico, agenda, SLA e
// evidências de conclusão.

import type { Money } from "@/types/proposals";

/**
 * Estados canônicos da TMF641 v4.1.0 usados na tela. A exibição traduz para
 * rótulos de negócio sem alterar o estado salvo (regras §11, Admin Neutra).
 */
export const SERVICE_ORDER_STATUSES = [
  "acknowledged",
  "pending",
  "inProgress",
  "held",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

/** Estados de uma demanda (item da ordem). */
export const SERVICE_ORDER_ITEM_STATUSES = [
  "pending",
  "inProgress",
  "held",
  "completed",
  "cancelled",
] as const;
export type ServiceOrderItemStatus =
  (typeof SERVICE_ORDER_ITEM_STATUSES)[number];

/** Profissional da equipe própria do seller (não pode terceirizar — §11). */
export interface ServiceOrderTechnician {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  email?: string;
}

/** Evidência obrigatória de conclusão; registrada quando tem arquivo. */
export interface ServiceOrderEvidence {
  fileName?: string;
  /** Endereço do arquivo para "Ver arquivo". */
  url?: string;
  registeredAt?: string;
}

export type ServiceOrderMessageAuthor = "seller" | "buyer" | "system";

export interface ServiceOrderMessage {
  id: string;
  author: ServiceOrderMessageAuthor;
  /** Nome exibido (organização ou "Neutra+ (Sistema)"). */
  authorName: string;
  sentAt: string;
  text: string;
}

/** Demanda da ordem: o serviço executado pelo seller. */
export interface ServiceOrderItem {
  /** Ex.: OS-2026-0038. */
  id: string;
  productName: string;
  status: ServiceOrderItemStatus;
  /** Endereço de atendimento, ou o canal quando é digital. */
  address: string;
  /** Coordenadas do endereço, para o mapa. */
  location?: { longitude: number; latitude: number };
  /** Execução digital, sem visita presencial (ex.: transferência de IPs). */
  remote?: boolean;
  technician?: ServiceOrderTechnician;
  scheduledAt?: string;
  /** Prazo de SLA declarado pelo seller. */
  slaDeadline: string;
  updatedAt: string;
  notes?: string;
  /** Uma entrada por evidência obrigatória, na ordem dos slots. */
  evidences: ServiceOrderEvidence[];
  reschedulesUsed: number;
  reschedulesAllowed: number;
  /** Atendimento adiado para esta data (rótulo "Adiada"). */
  postponedTo?: string;
  /** Alerta de risco de descumprimento do SLA (jeopardy). */
  jeopardy?: boolean;
  noShows?: number;
  completedAt?: string;
  cancelledAt?: string;
  amount: Money;
  messages: ServiceOrderMessage[];
}

/** Ordem de serviço de um pedido recebido pelo seller. */
export interface ServiceOrder {
  /** Pedido de origem (ORD-2026-001). */
  orderId: string;
  productName: string;
  status: ServiceOrderStatus;
  sellerName: string;
  buyerName: string;
  createdAt: string;
  amount: Money;
  /** Prazo do seller para responder ao pedido em espera. */
  responseDeadline?: string;
  /** Cancelada com o valor devolvido como crédito Neutra+. */
  creditIssued?: boolean;
  items: ServiceOrderItem[];
}

/** Contadores do topo das listas. */
export interface ServiceOrdersSummary {
  total: number;
  inProgress: number;
  awaiting: number;
  withIssue: number;
}

/** Nova previsão de atendimento ("Adiar atendimento"). */
export interface ServiceOrderPostponement {
  /** Data e hora locais, ISO sem fuso ("2026-07-10T09:00"). */
  scheduledAt: string;
  reason: string;
  /** Altera formalmente a agenda: conta nos reagendamentos. */
  reschedule: boolean;
  rescheduleType?: ServiceOrderRescheduleType;
  rescheduleReason?: string;
}

export const SERVICE_ORDER_RESCHEDULE_TYPES = [
  "internal",
  "buyerRequest",
  "buyerNoShow",
] as const;
export type ServiceOrderRescheduleType =
  (typeof SERVICE_ORDER_RESCHEDULE_TYPES)[number];

/** Técnico novo, cadastrado no próprio modal. */
export type ServiceOrderTechnicianDraft = Omit<ServiceOrderTechnician, "id">;
