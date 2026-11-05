import type { ProductOrder } from "@/services/orders.service";

/**
 * Contrato do pedido (contracts-api `/order-contracts`, NEU-521). O Orders
 * pede o contrato depois do pagamento integral; o Buyer assina na Autentique
 * e a assinatura conferida libera a execução no Orders.
 */

/**
 * awaiting_signer: ninguém do Buyer pediu para assinar.
 * provider_pending: signatário vinculado, envio à Autentique a começar (curto).
 * provider_uncertain: envio sem resposta; o worker reconcilia.
 * provider_failed: Autentique não configurada; a operação resolve.
 * awaiting_signatures: documento na Autentique, link de assinatura pronto.
 * signed: assinatura conferida (estado final).
 * cancelled: o Orders cancelou o pedido (estado final).
 */
export const CONTRACT_STATUSES = [
  "awaiting_signer",
  "provider_pending",
  "provider_uncertain",
  "provider_failed",
  "awaiting_signatures",
  "signed",
  "cancelled",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface ContractSignature {
  /** Usuário vinculado como signatário (`sub` do token dele). */
  subject: string;
  organizationId: string;
  /** true só depois da conferência na Autentique. */
  signed: boolean;
}

export interface OrderContract {
  contractId: string;
  orderId: string;
  checkoutId: string;
  status: ContractStatus;
  documentVersion: number;
  /** SHA-256 do PDF; null quando o pedido foi cancelado antes do contrato. */
  documentHash: string | null;
  snapshotVersion: string | null;
  /** Hoje sempre `buyer-only-v1`: só a organização Buyer assina. */
  policy: string;
  requiredSignerOrganizations: string[];
  aggregateVersion: number;
  /** true em provider_failed e provider_uncertain. */
  recoveryRequired: boolean;
  lastError: string | null;
  /** No máximo 1 item: o usuário do Buyer que pediu para assinar. */
  signatures: ContractSignature[];
}

export interface OrderContractPage {
  items: OrderContract[];
  total: number;
  page: number;
  size: number;
}

/** Resposta de `POST /sign`: o link pessoal de assinatura do Buyer. */
export interface ContractSigning {
  status: ContractStatus;
  /** null enquanto o envio à Autentique não terminou. */
  signingUrl: string | null;
  documentHash: string;
  /** Só quando a Autentique não gerou o link; tente de novo. */
  recoveryRequired?: boolean;
  lastError?: string;
}

/** Contrato com o pedido que o originou (produto, valor, data). */
export interface ContractEntry {
  contract: OrderContract;
  /** null quando a leitura do pedido falhou. */
  order: ProductOrder | null;
}

/** Contadores do topo da página. */
export interface ContractsSummary {
  awaitingSignature: number;
  processing: number;
  signed: number;
  cancelled: number;
}
