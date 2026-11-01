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

/** Status aceitos em `GET /admin/organizations?status=` (um por consulta). */
export const ORGANIZATION_STATUSES = [
  "pending",
  "active",
  "suspended",
  "anonymized",
  "taken_down",
] as const satisfies readonly OrganizationStatus[];

/** Tipo da organização; `platform_operator` é a própria Neutra+ (interna). */
export type PlatformOrganizationType =
  | AdminOrganizationType
  | "platform_operator";

export type OrganizationKycLevel =
  | "pending"
  | "basic"
  | "verified"
  | "complete";

/** Item de `GET /admin/organizations`. */
export interface AdminOrganizationSummary {
  id: string;
  legal_name: string;
  organization_type: PlatformOrganizationType;
  status: OrganizationStatus;
  kyc_level: OrganizationKycLevel;
  country_code: string;
  /** Documento mascarado (ex.: "12****0195"). */
  tax_id_masked: string;
  created_at: string;
  suspended_at?: string | null;
  suspended_reason?: string | null;
}

export interface AdminOrganizationList {
  items: AdminOrganizationSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * `GET /admin/organizations/{organization_id}`. Nome fantasia, e-mail de
 * contato e estado do KYC são do contrato novo: a identity-api ainda pode
 * responder sem eles.
 */
export interface AdminOrganizationDetail extends AdminOrganizationSummary {
  trade_name?: string | null;
  contact_email?: string | null;
  kyc_state?: string | null;
}

/** Membro de `GET /organizations/{org_id}/members`. */
export interface OrganizationMember {
  user_id: string;
  role: string;
  /** Do contrato novo: a identity-api pode responder só com id e papel. */
  email?: string | null;
  status?: string | null;
  joined_at?: string | null;
}

export interface OrganizationMembers {
  items: OrganizationMember[];
  total: number;
}

export interface AdminOrganizationsParams {
  status?: OrganizationStatus;
  /** 1 a 200; padrão 50. */
  limit?: number;
  offset?: number;
}

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

/**
 * Resultado de `POST /admin/sanctions/run`. Só diz se a organização ficou
 * limpa — o detalhe por lista fica em `/admin/sanctions/matches` (RN-557).
 */
export interface SanctionsScreeningResult {
  organization_id: string;
  screening_run_id: string;
  is_clean: boolean;
  checked_at: string;
}

/** Lista restritiva consultada na checagem de sanções. */
export type SanctionsSource = "ofac" | "un" | "bacen";

export type SanctionsDisposition =
  | "pending_review"
  | "confirmed"
  | "false_positive";

/**
 * Ocorrência de `GET /admin/sanctions/matches/{organization_id}`: uma lista
 * em que a organização bateu. A checagem compara só a própria organização —
 * razão social e documento (tax id) —, sem sócios nem arquivos do KYC.
 * Por RN-557, nada disto pode aparecer para o buyer/seller.
 */
export interface SanctionsMatch {
  check_log_id: string;
  source: SanctionsSource;
  matched: boolean;
  /**
   * 0–100. 100 = o documento da organização consta na lista; abaixo disso,
   * semelhança da razão social com um nome da lista.
   */
  match_score: number | null;
  stale: boolean;
  disposition: SanctionsDisposition;
  checked_at: string;
}

export const adminService = {
  /**
   * Organizações de um status (padrão `pending`), da identity-api. Exige
   * `org:suspend`. Sem busca nem filtro de tipo no upstream.
   */
  listOrganizations: (
    params: AdminOrganizationsParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<AdminOrganizationList>("/admin/organizations", {
      params: { ...params },
      signal: options.signal,
    }),

  /** Uma organização. Exige `org:suspend`; 404 quando não existe. */
  getOrganization: (
    organizationId: string,
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<AdminOrganizationDetail>(
      `/admin/organizations/${encodeURIComponent(organizationId)}`,
      { signal: options.signal },
    ),

  /**
   * Membros da organização. Exige `org:manage_members`; a identity-api só
   * lista a organização do próprio token (403 nas demais). Aceita o formato
   * novo (`items` + `total`) e o atual (`members`).
   */
  listOrganizationMembers: async (
    organizationId: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<OrganizationMembers> => {
    const data = await api.get<
      Partial<OrganizationMembers> & { members?: OrganizationMember[] }
    >(`/organizations/${encodeURIComponent(organizationId)}/members`, {
      signal: options.signal,
    });
    const items = data?.items ?? data?.members ?? [];
    return { items, total: data?.total ?? items.length };
  },

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

  /**
   * Roda de novo a checagem de sanções de uma organização, na hora (não é
   * assíncrono). Exige `sanctions:run`. A compliance-api só vê o novo
   * resultado depois de sincronizar a solicitação.
   */
  runSanctions: (organizationId: string) =>
    api.post<SanctionsScreeningResult>("/admin/sanctions/run", {
      organization_id: organizationId,
    }),

  /**
   * Ocorrências de sanções da organização (todas as checagens, mais recente
   * primeiro). Exige `sanctions:read_matches`. Organização nunca checada ou
   * limpa devolve lista vazia.
   */
  getSanctionsMatches: (
    organizationId: string,
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<{ matches: SanctionsMatch[] }>(
      `/admin/sanctions/matches/${encodeURIComponent(organizationId)}`,
      { signal: options.signal },
    ),
};
