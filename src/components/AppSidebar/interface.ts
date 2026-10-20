import type { IconType } from "react-icons";

// Papel do usuário: buyer/seller (organização no marketplace) ou admin (equipe
// da plataforma). Cada papel libera um grupo da navegação.
export type SidebarPersona = "buyer" | "seller" | "admin";

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
  // Rota do logo e do "início" do grupo (ex.: /dashboard, /admin).
  homeHref: string;
  // O grupo admin começa direto nas seções, sem o título do papel.
  hideHeading?: boolean;
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
