// Service do painel administrativo (SDD §12.2).
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/*`), que anexa o Bearer do cookie httpOnly.

import { api } from "./api.client";
import type { KycLevelSupported, KycState } from "./kyc.service";

/** Status de ciclo de vida da organização (usado também pelo `/me`). */
export type OrganizationStatus =
  | "pending"
  | "active"
  | "suspended"
  | "anonymized"
  | "taken_down";

export type AdminOrganizationType = "buyer" | "seller";

/**
 * Status de uma solicitação na fila de KYC. O contrato HTTP é em inglês: os
 * valores vão traduzidos só na tela, nunca em `?status=`.
 */
export const KYC_QUEUE_STATUSES = [
  "pending",
  "submitted",
  "correction_requested",
  "approved",
  "rejected",
  "suspended",
] as const;

export type KycQueueStatus = (typeof KYC_QUEUE_STATUSES)[number];

/** Filtros extras aceitos em `?status=`, além dos status da solicitação. */
export const KYC_QUEUE_STATUS_FILTERS = [
  ...KYC_QUEUE_STATUSES,
  "under_review",
  "special_review",
] as const;

export type KycQueueStatusFilter = (typeof KYC_QUEUE_STATUS_FILTERS)[number];

export type KycQueueSlaState =
  | "not_started"
  | "in_progress"
  | "overdue"
  | "closed";

export type KycQueueAlertCode =
  | "expired_document"
  | "pending_scm_license"
  | "unreadable_document"
  | "inactive_tax_registration"
  | "sanctions";

export type KycQueueAlertStatus =
  | "active"
  | "inactive"
  | "not_verified"
  | "not_applicable";

export interface KycQueueAlert {
  code: KycQueueAlertCode;
  /** Só `active` é exibido. */
  status: KycQueueAlertStatus;
}

/** Item de `GET /admin/kyc/queue`. */
export interface KycQueueItem {
  /** Código de exibição (KYC-xxxxxxxx). Para abrir a solicitação, use `organization_id`. */
  request_id: string;
  organization_id: string;
  organization_name: string;
  organization_type: AdminOrganizationType;
  country_code: string;
  tax_id: string;
  tax_id_kind: string;
  status: KycQueueStatus;
  kyc_state: KycState;
  kyc_level: KycLevelSupported;
  requested_level: KycLevelSupported | null;
  registered_at: string;
  submitted_at: string | null;
  documents: {
    sent: number;
    required: number;
    pending: number;
    missing_types: string[];
  };
  sla: {
    state: KycQueueSlaState;
    limit_business_hours: number;
    started_at: string | null;
    deadline_at: string | null;
    remaining_business_hours: number | null;
  };
  alerts: KycQueueAlert[];
  flags: {
    under_review: boolean;
    special_review: boolean;
  };
}

export interface KycQueueIndicators {
  total: number;
  pending: number;
  rejected: number;
  by_status: Record<KycQueueStatus, number>;
}

export interface KycQueue {
  items: KycQueueItem[];
  total: number;
  limit: number;
  offset: number;
  indicators: KycQueueIndicators;
  generated_at: string;
}

export interface KycQueueParams {
  /** Nome, CNPJ ou id (0–100 caracteres). */
  search?: string;
  status?: KycQueueStatusFilter;
  type?: AdminOrganizationType;
  /** AAAA-MM-DD. */
  date_from?: string;
  date_to?: string;
  /** 1–200. */
  limit?: number;
  offset?: number;
}

export const adminService = {
  /**
   * Fila de KYC, da solicitação mais antiga para a mais nova, com indicadores
   * e SLA (72h úteis). Exige `kyc:approve` com MFA; cada leitura entra no
   * audit log.
   */
  getKycQueue: (
    params: KycQueueParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<KycQueue>("/admin/kyc/queue", {
      params: { ...params },
      signal: options.signal,
    }),
};
