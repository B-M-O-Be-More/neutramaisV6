import type { Money } from "@/types/proposals";

/**
 * RFQs que chegam ao seller (Figma 2948-52347). A rfq-api ainda não tem
 * regras de negócio: estes formatos seguem o design e são o que o hook
 * useSellerRfqs devolve até a API entrar. Os rótulos vêm do i18n
 * (SellerOrders.rfq.*).
 */

// Ordem dos contadores do design: Pendentes, Com proposta, Convertidas,
// Recusadas/Expiradas.
export const SELLER_RFQ_STATUSES = [
  "awaiting",
  "proposalSent",
  "converted",
  "declined",
  "expired",
] as const;
export type SellerRfqStatus = (typeof SELLER_RFQ_STATUSES)[number];

/** Validade da proposta oferecida no formulário (dias corridos). */
export const SELLER_RFQ_VALIDITY_DAYS = [7, 15, 30, 60] as const;
export type SellerRfqValidityDays = (typeof SELLER_RFQ_VALIDITY_DAYS)[number];
export const DEFAULT_SELLER_RFQ_VALIDITY_DAYS: SellerRfqValidityDays = 15;

export interface SellerRfqBuyer {
  name: string;
  /** CNPJ já formatado. */
  taxId: string;
}

/** Proposta enviada pelo seller. Cada atualização gera uma nova versão. */
export interface SellerRfqProposal {
  price: Money;
  /** Texto livre do SLA técnico (ex.: "99,5%"). */
  sla: string;
  deliveryDays: number;
  validityDays: SellerRfqValidityDays;
  /** A entrega depende de vistoria técnica prévia (selo "VISTORIA"). */
  requiresSiteSurvey: boolean;
  notes: string;
  version: number;
}

/** O que o seller preenche ao enviar ou atualizar a proposta. */
export type SellerRfqProposalDraft = Omit<SellerRfqProposal, "version">;

export interface SellerRfq {
  /** Ex.: RFQ-2026-EXT-041. */
  id: string;
  productName: string;
  buyer: SellerRfqBuyer;
  /** Local da entrega (ex.: "Fortaleza/CE — Av. Santos Dumont, 3030"). */
  location: string;
  /** Teto do comprador, já formatado (ex.: "Até R$ 4.000,00/mês"). */
  budget?: string;
  /** Solicitação do comprador. */
  description: string;
  /** ISO 8601. */
  receivedAt: string;
  /** Fim do prazo de resposta do seller. */
  deadlineAt: string;
  status: SellerRfqStatus;
  proposal?: SellerRfqProposal;
  /** Justificativa da recusa do seller. */
  declineReason?: string;
  /** Pedido gerado quando o comprador aceitou a proposta. */
  orderId?: string;
}
