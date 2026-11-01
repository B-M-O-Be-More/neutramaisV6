import type { OrganizationAddress } from "@/services/organizations.service";

export interface UseOrganizationAddressReturn {
  /** null sem endereço cadastrado, carregando ou em erro. */
  address: OrganizationAddress | null;
  isLoading: boolean;
}
