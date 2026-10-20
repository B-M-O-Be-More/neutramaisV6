import type {
  AdminOrganizationType,
  KycQueueIndicators,
  KycQueueItem,
  KycQueueStatusFilter,
} from "@/services/admin.service";

export type { KycQueueIndicators, KycQueueItem };

/** Filtros da fila; vazio = sem filtro. Todos vão para a API. */
export interface AdminKycQueueFilters {
  search: string;
  status: KycQueueStatusFilter | "";
  type: AdminOrganizationType | "";
  /** AAAA-MM-DD (formato do <input type="date">). */
  dateFrom: string;
  dateTo: string;
}

/**
 * Falha da última consulta:
 * - `forbidden` — sem `kyc:approve` ou sem MFA na sessão (401/403)
 * - `failed`    — rede, 5xx ou qualquer outro erro
 */
export type AdminKycQueueError = "forbidden" | "failed";

export interface UseAdminKycQueueReturn {
  /** Solicitações já carregadas, da mais antiga para a mais nova. */
  items: KycQueueItem[];
  /** Total de solicitações que atendem aos filtros. */
  total: number;
  /** Indicadores da última resposta; null até a primeira. */
  indicators: KycQueueIndicators | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: AdminKycQueueError | null;
  /** Busca a próxima página e acrescenta à lista. */
  loadMore: () => void;
  /** Refaz a consulta do zero. */
  refetch: () => void;
}
