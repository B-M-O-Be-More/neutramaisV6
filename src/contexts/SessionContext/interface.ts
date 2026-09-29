import type { SidebarPersona } from "@/components/AppSidebar";
import type { MeProfile } from "@/services/auth.service";

/**
 * loading: consultando o /me (ou renovando o token).
 * authenticated: perfil carregado.
 * error: falha que não é de sessão (rede, 5xx) — dá para tentar de novo sem
 * perder o login. Sessão inválida não vira estado: redireciona para /login.
 */
export type SessionStatus = "loading" | "authenticated" | "error";

export interface SessionContextProps {
  status: SessionStatus;
  /** Perfil do `GET /me`. null até carregar. */
  profile: MeProfile | null;
  /** Grupos da navegação derivados dos papéis. */
  personas: SidebarPersona[];
  /** Consulta o /me de novo (ex.: após erro, ou após editar o cadastro). */
  reload: () => void;
}

export interface SessionProviderProps {
  children: React.ReactNode;
}
