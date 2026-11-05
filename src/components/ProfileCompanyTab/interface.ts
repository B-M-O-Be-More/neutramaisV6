import type { MeProfile } from "@/services/auth.service";
import type { OrganizationAddress } from "@/services/organizations.service";

export interface ProfileCompanyTabProps {
  profile: MeProfile;
  /** Endereço da sede; null sem cadastro. */
  address: OrganizationAddress | null;
  isLoadingAddress: boolean;
}
