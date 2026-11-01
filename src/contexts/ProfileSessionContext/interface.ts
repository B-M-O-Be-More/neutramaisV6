import type {
  ProfileContext,
  SelectableProfile,
} from "@/services/profileSession.service";

/**
 * loading: abrindo (ou reaproveitando) a sessão do perfil.
 * ready: contexto do perfil validado (com a permissão exigida, se houver).
 * forbidden: a identity-api não libera o perfil (ou a permissão).
 * unavailable: identity-api temporariamente indisponível (503).
 * error: outra falha (rede, 5xx) — dá para tentar de novo.
 * Sessão perdida (refresh recusado) não vira estado: redireciona para /login.
 */
export type ProfileSessionStatus =
  | "loading"
  | "ready"
  | "forbidden"
  | "unavailable"
  | "error";

export interface ProfileSessionContextProps {
  status: ProfileSessionStatus;
  /** Contexto atual (`GET /auth/context`). null até ficar pronto. */
  context: ProfileContext | null;
  /** Organização das chamadas das APIs: a do contexto, não a do /me. */
  organizationId: string | null;
  /** Abre a sessão de novo (ex.: após erro). */
  reload: () => void;
}

export interface ProfileSessionProviderProps {
  /** Perfil da área: o par emitido não mistura Buyer e Seller. */
  profile: SelectableProfile;
  /**
   * Permissão que o contexto precisa ter para liberar a página. Sem ela, a
   * página abre e cada API responde 403 ao que o perfil não pode.
   */
  requiredPermission?: string | null;
  children: React.ReactNode;
}
