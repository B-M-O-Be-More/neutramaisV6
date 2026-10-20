import type { AdminKycQueueFilters } from "@/hooks/useAdminKycQueue";

export interface AdminOrganizationFiltersProps {
  value: AdminKycQueueFilters;
  onChange: (value: AdminKycQueueFilters) => void;
  /** Solicitações carregadas / total que atende aos filtros. */
  shown: number;
  total: number;
}
