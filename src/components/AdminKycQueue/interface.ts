import type {
  AdminKycQueueFilters,
  UseAdminKycQueueReturn,
} from "@/hooks/useAdminKycQueue";

export interface AdminKycQueueProps {
  /** Valores dos campos (a busca chega à API com atraso, pela página). */
  filters: AdminKycQueueFilters;
  onFiltersChange: (filters: AdminKycQueueFilters) => void;
  /** Estado da consulta `GET /admin/kyc/queue` (useAdminKycQueue). */
  queue: UseAdminKycQueueReturn;
}
