import type { IconType } from "react-icons";

// Papel da organização no marketplace. Cada papel libera um grupo da navegação.
export type SidebarPersona = "buyer" | "seller";

// Cor do contador de um item: segue o papel do grupo, ou alerta (vermelho).
export type SidebarBadgeTone = "persona" | "danger";

export interface SidebarNavItem {
  // Chave única — nomeia o texto no i18n (AppSidebar.items.<key>) e o contador.
  key: string;
  href: string;
  icon: IconType;
  // Alguns ícones do design são menores que o padrão de 14px.
  iconSize?: string;
  badgeTone?: SidebarBadgeTone;
}

export interface SidebarNavSection {
  // Nomeia o título no i18n (AppSidebar.sections.<key>).
  key: string;
  items: SidebarNavItem[];
}

export interface SidebarNavGroup {
  persona: SidebarPersona;
  sections: SidebarNavSection[];
}

export interface SidebarUser {
  name: string;
  // Papéis que a organização do usuário exerce — define os grupos exibidos.
  personas: SidebarPersona[];
}

export interface AppSidebarProps {
  user: SidebarUser;
  // Contadores por item (chave do item → quantidade). Zero ou ausente = oculto.
  badges?: Partial<Record<string, number>>;
  // Chamado ao escolher um item — o layout mobile usa para fechar o drawer.
  onNavigate?: () => void;
}
