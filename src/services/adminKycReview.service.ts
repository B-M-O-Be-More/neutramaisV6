// Service da revisão de KYC do admin, na compliance-api (SDD §12.2).
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/admin/kyc/*`), que anexa o Bearer do cookie
// httpOnly e normaliza as respostas da compliance-api para o ResponseEnvelope.
//
// Sequência: a fila (Identity) dá o `organization_id` → `openRequest` devolve
// `request_id` e `version` → `startReview` → uma decisão por documento → a
// decisão da conta. Toda mutação leva o `version` da última resposta em
// `expected_version`.

import { api } from "./api.client";
import type { AdminOrganizationType } from "./admin.service";

export type KycReviewStatus =
  | "submitted"
  | "in_review"
  | "correction_requested"
  | "special_review"
  | "approved"
  | "rejected";

/** Situação da aplicação da decisão na conta (Identity). */
export type KycActivationStatus = "pending" | "applied" | "failed";

/** Motivos de recusa de um documento. */
export const KYC_DOCUMENT_REASON_CODES = [
  "unreadable_or_corrupted",
  "expired_or_invalid",
  "data_mismatch",
  "missing_document",
  "other",
] as const;

export type KycDocumentReasonCode = (typeof KYC_DOCUMENT_REASON_CODES)[number];

/** Motivos de recusa da conta. Uso interno — não exibir ao usuário final. */
export const KYC_ACCOUNT_REASON_CODES = [
  "inactive_tax_registration",
  "fraud_inconsistency",
  "invalid_scm_license",
  "aml_suspicion",
  "other",
] as const;

export type KycAccountReasonCode = (typeof KYC_ACCOUNT_REASON_CODES)[number];

export const KYC_ACCOUNT_DECISIONS = [
  "approve",
  "request_correction",
  "reject",
] as const;

export type KycAccountDecision = (typeof KYC_ACCOUNT_DECISIONS)[number];

export type KycDocumentDecision = "approve" | "reject";

export interface KycReviewOrganization {
  organization_id: string;
  legal_name: string;
  organization_type: AdminOrganizationType;
  tax_id: string;
  tax_id_country: string;
}

export interface KycReviewDocument {
  id: string;
  document_type: string;
  /** `not_submitted` = requisito sem arquivo (`current_version` 0). */
  submission_status: "submitted" | "not_submitted";
  review_status: "pending" | "approved" | "rejected";
  current_version: number;
  mime_type: string | null;
  uploaded_at: string | null;
  reason_code: KycDocumentReasonCode | null;
  reason_details: string | null;
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface KycAutomaticCheck {
  check_type: "tax_registration" | "sanctions";
  status: "passed" | "failed" | "not_verified" | "error";
  alert: boolean;
  expired: boolean;
  checked_at: string | null;
  valid_until: string | null;
  source: string | null;
  evidence_ref: string | null;
  /** `advisory` (padrão): só `failed` bloqueia. Outro valor: tudo precisa passar. */
  policy: string;
}

export interface KycHistoryEvent {
  id: string;
  /** Ex.: entered_queue, review_started, document_approved, account_decided. */
  event_type: string;
  actor_id: string | null;
  document_id: string | null;
  occurred_at: string;
  details: Record<string, unknown>;
}

export interface KycHistory {
  items: KycHistoryEvent[];
  total: number;
  limit: number;
  offset: number;
}

/** `RequestDetail` da compliance-api. */
export interface KycReviewRequest {
  request_id: string;
  /** Código de exibição (KYC-xxxxxxxx). */
  display_id: string;
  status: KycReviewStatus;
  /** Vai em `expected_version` na próxima mutação. */
  version: number;
  requested_level: string;
  submitted_at: string;
  reviewer_id: string | null;
  review_started_at: string | null;
  organization: KycReviewOrganization;
  documents: KycReviewDocument[];
  automatic_checks: KycAutomaticCheck[];
  history: KycHistory;
  correction_attempt_count?: number;
  latest_decision_id?: string | null;
  activation_status?: KycActivationStatus | null;
}

export interface KycDocumentAccessUrl {
  url: string;
  expires_at: string;
}

export interface KycDocumentDecisionBody {
  decision: KycDocumentDecision;
  /** Obrigatório na recusa; proibido na aprovação. */
  reason_code?: KycDocumentReasonCode;
  /** Obrigatório com `other`. Até 1000 caracteres. */
  reason_details?: string;
  /** Nota interna. Até 1000 caracteres. */
  reviewer_note?: string;
  /** `current_version` do documento (0 quando não há arquivo). */
  document_version: number;
  expected_version: number;
}

export interface KycAccountDecisionBody {
  decision: KycAccountDecision;
  expected_version: number;
  /** Só na recusa (obrigatório). */
  reason_code?: KycAccountReasonCode;
  /** Só na recusa; obrigatório com `other`. Até 1000 caracteres. */
  reason_details?: string;
  /** Só (e obrigatório) no pedido de correção. Até 2000 caracteres. */
  user_instructions?: string;
  /** Nota interna. Até 1000 caracteres. */
  reviewer_note?: string;
}

export interface KycAccountDecisionResult {
  decision_id: string;
  request_id: string;
  organization_id: string;
  actor_id: string;
  decision: KycAccountDecision;
  requested_level: string;
  status: KycReviewStatus;
  request_version: number;
  correction_attempt_count: number;
  activation_status: KycActivationStatus;
  /** Ex.: identity_unavailable, kyc_decision_snapshot_stale. */
  application_error: string | null;
  source_kyc_state: string | null;
  source_kyc_level: string | null;
  documents: Record<string, unknown>[];
  user_instructions: string | null;
  reason_code: KycAccountReasonCode | null;
  reason_details?: string | null;
}

export interface KycHistoryPage {
  /** 1–200. */
  history_limit?: number;
  /** 0–100000. */
  history_offset?: number;
}

const BASE = "/admin/kyc";

export const adminKycReviewService = {
  /**
   * Abre ou sincroniza a solicitação da organização com o snapshot atual do
   * Identity. Não é uma leitura: repetir usa a mesma solicitação.
   */
  openRequest: (organizationId: string) =>
    api.post<KycReviewRequest>(
      `${BASE}/organizations/${organizationId}/request`,
    ),

  /** Detalhe gravado, sem efeito colateral. */
  getRequest: (requestId: string, page: KycHistoryPage = {}) =>
    api.get<KycReviewRequest>(`${BASE}/requests/${requestId}`, {
      params: { ...page },
    }),

  /** URL assinada de curta duração para abrir o arquivo. */
  getDocumentUrl: (
    requestId: string,
    documentId: string,
    purpose: "view" | "download" = "view",
  ) =>
    api.post<KycDocumentAccessUrl>(
      `${BASE}/requests/${requestId}/documents/${documentId}/access-url`,
      { purpose },
    ),

  /** `submitted` → `in_review`, atribuída a quem chamou. */
  startReview: (requestId: string, expectedVersion: number) =>
    api.post<KycReviewRequest>(`${BASE}/requests/${requestId}/start-review`, {
      expected_version: expectedVersion,
    }),

  decideDocument: (
    requestId: string,
    documentId: string,
    body: KycDocumentDecisionBody,
  ) =>
    api.post<KycReviewRequest>(
      `${BASE}/requests/${requestId}/documents/${documentId}/decision`,
      body,
    ),

  /** Volta um documento decidido para `pending`. */
  reopenDocument: (
    requestId: string,
    documentId: string,
    expectedVersion: number,
  ) =>
    api.post<KycReviewRequest>(
      `${BASE}/requests/${requestId}/documents/${documentId}/reopen`,
      { expected_version: expectedVersion },
    ),

  /**
   * Decisão da conta. Responde 200 mesmo quando a aplicação no Identity
   * falha (`activation_status: "failed"`). Repetir com a mesma chave e o mesmo
   * corpo tenta aplicar de novo.
   */
  decideAccount: (
    requestId: string,
    body: KycAccountDecisionBody,
    idempotencyKey: string,
  ) =>
    api.post<KycAccountDecisionResult>(
      `${BASE}/requests/${requestId}/decision`,
      body,
      { headers: { "Idempotency-Key": idempotencyKey } },
    ),

  /** Leitura da decisão, sem nova tentativa de aplicação. */
  getDecision: (decisionId: string) =>
    api.get<KycAccountDecisionResult>(`${BASE}/decisions/${decisionId}`),

  /**
   * Depois de `kyc_decision_snapshot_stale`: volta a solicitação para
   * `submitted` com o snapshot atual. A nova decisão precisa de chave nova.
   */
  refreshReview: (requestId: string) =>
    api.post<KycReviewRequest>(`${BASE}/requests/${requestId}/refresh-review`),
};
