import type { SidebarPersona } from "@/components/AppSidebar/interface";
import type { MeProfile } from "@/services/auth.service";

export interface ProfileAccessTabProps {
  profile: MeProfile;
  /** Papéis da sessão (buyer, seller, admin). */
  personas: SidebarPersona[];
  /** Envio de documentos de KYC (fluxo existente). */
  kycHref: string;
}
