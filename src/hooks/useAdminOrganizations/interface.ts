import type {
  AdminOrganizationSummary,
  OrganizationStatus,
} from "@/services/admin.service";

export type AdminOrganizationsError = "forbidden" | "failed";

export interface UseAdminOrganizationsReturn {
  /** Organizações dos status pedidos, da mais nova para a mais antiga. */
  items: AdminOrganizationSummary[];
  isLoading: boolean;
  error: AdminOrganizationsError | null;
  reload: () => void;
}

/** Status a carregar; vazio = todos. */
export type AdminOrganizationsStatusFilter = OrganizationStatus | "";
