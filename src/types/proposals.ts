import type { OfferCategory } from "@/data/offerCategories";

/**
 * Domínio de propostas e RFQ do buyer (Figma 2036-13698). A rfq-api
 * (TMF648) ainda não existe: estes formatos seguem as regras de negócio §7
 * (RFQ, pré-venda e negociação) e são o que os hooks devolvem até a API
 * entrar. Os rótulos vêm do i18n (Proposals.*).
 */

/** A proposta mantém a moeda da oferta/RFQ de origem — não muda na revisão. */
export type ProposalCurrency = "BRL" | "USD";

/** Valor monetário com a moeda dele. */
export interface Money {
  amount: number;
  currency: ProposalCurrency;
}

/** Categorias que aceitam cotação (as quatro do MVP). */
export const QUOTE_CATEGORIES = [
  "connectivity",
  "physicalInfra",
  "hardware",
  "numberingResources",
] as const satisfies readonly OfferCategory[];
export type QuoteCategory = (typeof QUOTE_CATEGORIES)[number];

/* ---------------------------------------------------------------------------
 * Proposta direta — enviada a um único seller escolhido no catálogo.
 * ------------------------------------------------------------------------- */

// Ordem das abas do design: Aguardando, Revisão, Aceitas, Recusadas,
// Canceladas.
export const DIRECT_PROPOSAL_STATUSES = [
  "awaiting",
  "revisionRequested",
  "accepted",
  "rejected",
  "cancelled",
] as const;
export type DirectProposalStatus = (typeof DIRECT_PROPOSAL_STATUSES)[number];

export interface ProposalSeller {
  name: string;
  /** CNPJ já formatado. */
  taxId: string;
  kycVerified: boolean;
}

export interface DirectProposal {
  /** Ex.: PROP-D-001. */
  id: string;
  /** Cada revisão gera uma nova versão (v1, v2...). */
  version: number;
  /** Oferta de origem — base para uma nova proposta ao mesmo seller. */
  offeringId: string;
  seller: ProposalSeller;
  productName: string;
  category: QuoteCategory;
  price: Money;
  /** Texto livre do SLA técnico (ex.: "99,9% de disponibilidade"). */
  sla: string;
  deliveryBusinessDays: number;
  validityDays: number;
  cancellationPolicy: string;
  notes?: string;
  /** ISO 8601. */
  sentAt: string;
  expiresAt: string;
  status: DirectProposalStatus;
  /** Andamento da análise do seller, de 0 a 100. */
  progress?: number;
  /** Comentário estruturado do seller (pedido de revisão, recusa...). */
  sellerMessage?: string;
  /** Pedido gerado no aceite. */
  orderId?: string;
}

/** Condições que o buyer pode alterar ao revisar. A moeda fica de fora. */
export interface DirectProposalRevision {
  price: number;
  sla: string;
  deliveryBusinessDays: number;
  cancellationPolicy: string;
  notes: string;
}

export const PROPOSAL_CANCEL_REASONS = [
  "otherSeller",
  "otherRfqSupplier",
  "budgetRevised",
  "specChanged",
  "sellerTooSlow",
  "other",
] as const;
export type ProposalCancelReason = (typeof PROPOSAL_CANCEL_REASONS)[number];

/* ---------------------------------------------------------------------------
 * RFQ — enviada em lote a todos os sellers elegíveis da categoria.
 * ------------------------------------------------------------------------- */

// Ordem das abas do design: Com Proposta, Aguardando, Convertidas, Expiradas.
// Canceladas só aparecem em "Todas".
export const RFQ_STATUSES = [
  "proposalReceived",
  "awaiting",
  "converted",
  "expired",
  "cancelled",
] as const;
export type RfqStatus = (typeof RFQ_STATUSES)[number];

/** Prazo para os sellers responderem. O padrão da plataforma é 72h. */
export const RFQ_RESPONSE_HOURS = [24, 48, 72] as const;
export type RfqResponseHours = (typeof RFQ_RESPONSE_HOURS)[number];
export const DEFAULT_RFQ_RESPONSE_HOURS: RfqResponseHours = 72;

/** O que o buyer preenche no assistente de nova RFQ. */
export interface RfqDraft {
  category: QuoteCategory;
  productName: string;
  description: string;
  location: string;
  /** Texto livre (ex.: "Até R$ 5.000/mês"). */
  budget: string;
  responseHours: RfqResponseHours;
  urgent: boolean;
  requirements: string;
}

export interface Rfq extends RfqDraft {
  /** Ex.: RFQ-2026-326. */
  id: string;
  createdAt: string;
  /** Fim do prazo de resposta dos sellers. */
  deadlineAt: string;
  status: RfqStatus;
  notifiedSellers: number;
  proposalsReceived: number;
  bestProposal?: Money;
  orderId?: string;
}
