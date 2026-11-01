import type { OfferCategory } from "@/data/offerCategories";
import type { Money } from "@/types/proposals";

/**
 * Contratos do buyer (Figma 2084-11696 e 2190-14094). A API de contratos
 * ainda não existe: estes formatos são o que o hook devolve até ela entrar.
 * Os rótulos vêm do i18n (Contracts.*).
 */

export const CONTRACT_STATUSES = ["active", "renewing", "suspended"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Ciclo de cobrança: o valor sai como "/mês" ou "/ano". */
export type ContractBillingCycle = "monthly" | "yearly";

/** Último reajuste aplicado: "IPCA +3,2% (mai/26)". */
export interface ContractAdjustment {
  index: string;
  /** Percentual aplicado (3.2 = 3,2%). */
  rate: number;
  /** ISO — mês em que o reajuste entrou. */
  appliedAt: string;
}

/** Cláusula do documento do contrato, no idioma em que foi assinado. */
export interface ContractClause {
  title: string;
  body: string;
}

export type ContractPaymentStatus = "paid" | "pending" | "overdue";

export interface ContractPayment {
  id: string;
  /** ISO. */
  dueDate: string;
  /** Ex.: NF-88210. */
  invoiceNumber: string;
  amount: Money;
  status: ContractPaymentStatus;
}

export type ContractChangeRequestStatus = "pending" | "accepted" | "rejected";

/** Aditivo (change request) pedido pelo buyer; o seller aceita ou recusa. */
export interface ContractChangeRequest {
  id: string;
  description: string;
  /** ISO. */
  requestedAt: string;
  status: ContractChangeRequestStatus;
}

export interface Contract {
  /** Ex.: CTR-2026-001. */
  id: string;
  /** Pedido que originou o contrato. Ex.: ORD-2026-001. */
  orderId: string;
  productName: string;
  sellerName: string;
  category: OfferCategory;
  /** ISO. */
  startDate: string;
  /** ISO; null quando não há cobrança prevista (ex.: suspenso). */
  nextBillingDate: string | null;
  /** ISO — fim do período atual, quando a renovação automática acontece. */
  renewsAt: string;
  autoRenew: boolean;
  status: ContractStatus;
  price: Money;
  billingCycle: ContractBillingCycle;
  /** Disponibilidade contratual (99.5 = 99,5%). */
  slaPercent: number;
  loyaltyMonths: number;
  /** Multa de saída hoje; null quando sair não gera multa. */
  exitFee: Money | null;
  adjustment: ContractAdjustment | null;
  overdueInvoices: number;
  clauses: ContractClause[];
  /** Do mais recente ao mais antigo. */
  payments: ContractPayment[];
  changeRequests: ContractChangeRequest[];
  /** O buyer já pediu o cancelamento; o seller ainda vai processar. */
  cancellationRequested: boolean;
}

/** Contadores do topo da página. */
export interface ContractsSummary {
  active: number;
  renewing: number;
  suspended: number;
  changeRequests: number;
}
