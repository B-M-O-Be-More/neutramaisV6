import type { ProfileContext } from "@/services/profileSession.service";

/**
 * loading: abrindo (ou reaproveitando) a sessão de perfil Seller.
 * ready: contexto Seller validado, com `geo:coverage:read`.
 * forbidden: a identity-api não libera o perfil Seller (ou a permissão).
 * unavailable: identity-api temporariamente indisponível (503).
 * error: outra falha (rede, 5xx) — dá para tentar de novo.
 * Sessão perdida (refresh recusado) não vira estado: redireciona para /login.
 */
export type SellerSessionStatus =
  | "loading"
  | "ready"
  | "forbidden"
  | "unavailable"
  | "error";

export interface SellerSessionContextProps {
  status: SellerSessionStatus;
  /** Contexto atual (`GET /auth/context`). null até ficar pronto. */
  context: ProfileContext | null;
  /** Organização das chamadas da geo-api: a do contexto, não a do /me. */
  organizationId: string | null;
  /** Abre a sessão de novo (ex.: após erro). */
  reload: () => void;
}

export interface SellerSessionProviderProps {
  children: React.ReactNode;
}
