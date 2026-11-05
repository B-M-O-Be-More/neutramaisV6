/**
 * Tickets de suporte (Figma 3108-100267). A API de suporte ainda não existe:
 * estes formatos são o que o hook devolve até ela entrar. Os rótulos vêm do
 * i18n (Tickets.*).
 */

/** P1 crítico (4h) · P2 alto (24h) · P3 médio (48h) · P4 baixo (72h). */
export const TICKET_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  "open",
  "inProgress",
  "awaitingSeller",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CATEGORIES = [
  "provisioning",
  "generalQuestion",
  "slaQuality",
  "contracts",
  "fiscal",
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/** Abas da lista (Figma 3108-101542). */
export const TICKET_FILTERS = [
  "all",
  "open",
  "inProgress",
  "resolved",
  "mine",
] as const;
export type TicketFilter = (typeof TICKET_FILTERS)[number];

/** Pedido, oferta ou contrato a que o ticket se refere. */
export interface TicketReference {
  kind: "order" | "offer" | "contract";
  id: string;
}

export interface Ticket {
  /** Ex.: TKT-2026-041. */
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  /** Dúvida de pré-venda sobre uma oferta (sempre P4). */
  presale: boolean;
  reference: TicketReference | null;
  /** Equipe ou pessoa que atende. */
  assignee: string;
  /** ISO. */
  openedAt: string;
  /** ISO. */
  updatedAt: string;
  /** ISO — fim do SLA de atendimento; null depois de resolvido. */
  slaDeadline: string | null;
  commentCount: number;
  /** Aberto pelo usuário da sessão (aba "Meus Tickets"). */
  openedByMe: boolean;
}

/** Contadores do topo da página. */
export interface TicketsSummary {
  open: number;
  critical: number;
  resolvedThisMonth: number;
  presale: number;
}
