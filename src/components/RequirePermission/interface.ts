import type { ReactNode } from "react";

import type { SidebarPersona } from "@/components/AppSidebar";

export interface RequirePermissionProps {
  /**
   * Perfil exigido. `admin` = `admin_neutra` ou `super_admin`; `buyer` e
   * `seller` seguem os papéis da organização (ver rolesToPersonas).
   */
  role: SidebarPersona;
  /** Só é montado com a permissão confirmada. */
  children: ReactNode;
}
