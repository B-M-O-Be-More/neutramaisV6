import type { Money } from "@/types/proposals";

/**
 * Devoluções e trocas do buyer (Figma 2943-31366). A API de devoluções ainda
 * não existe: estes formatos são o que o ReturnsContext guarda até ela entrar.
 * Os rótulos vêm do i18n (Returns.*).
 */

/** Devolução: reembolso em crédito. Troca: outro item após a análise. */
export const RETURN_TYPES = ["return", "exchange"] as const;
export type ReturnRequestType = (typeof RETURN_TYPES)[number];

// Ordem do formulário (Figma 2943-31770).
export const RETURN_REASONS = [
  "defect",
  "wrongProduct",
  "notAsDescribed",
  "transportDamage",
  "regret",
  "other",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_STATUSES = [
  "awaitingSeller",
  "receivedBySeller",
  "contested",
  "rejected",
  "inMediation",
  "returning",
  "returnInTransit",
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** Quem arca com o frete de retorno, conforme o motivo. */
export type ReturnFreightPayer = "seller" | "carrier" | "buyer" | "toBeDefined";

export type ReturnAttachmentKind = "image" | "video" | "document";

export interface ReturnAttachment {
  id: string;
  name: string;
  kind: ReturnAttachmentKind;
}

export interface ReturnRequest {
  /** Ex.: DEV-2026-018. */
  id: string;
  /** Pedido de origem. Ex.: ORD-2026-090. */
  orderId: string;
  productName: string;
  quantity: number;
  type: ReturnRequestType;
  reason: ReturnReason;
  description: string;
  buyerName: string;
  sellerName: string;
  amount: Money;
  status: ReturnStatus;
  /** ISO. */
  requestedAt: string;
  /** ISO — prazo de resposta do seller; null quando não corre prazo. */
  slaDeadline: string | null;
  attachments: ReturnAttachment[];
}

/** Contadores do topo da página. */
export interface ReturnsSummary {
  total: number;
  awaitingAction: number;
  contested: number;
  returning: number;
}

/** Pedido entregue que ainda aceita devolução (cabeçalho do formulário). */
export interface ReturnableOrder {
  id: string;
  productName: string;
  quantity: number;
  sellerName: string;
  buyerName: string;
  amount: Money;
  /** ISO. */
  receivedAt: string;
}

/** O que o buyer envia ao solicitar. */
export interface ReturnRequestDraft {
  type: ReturnRequestType;
  reason: ReturnReason;
  description: string;
  files: File[];
}
