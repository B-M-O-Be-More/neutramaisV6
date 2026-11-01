import type {
  ProfileSessionContextProps,
  ProfileSessionStatus,
} from "@/contexts/ProfileSessionContext/interface";

/** Estados da sessão de perfil Seller (ver ProfileSessionContext). */
export type SellerSessionStatus = ProfileSessionStatus;

export type SellerSessionContextProps = ProfileSessionContextProps;

export interface SellerSessionProviderProps {
  /**
   * Permissão exigida para liberar a página. Padrão `geo:coverage:read`, a
   * da geo-api; `null` libera só pelo perfil (ex.: carteira).
   */
  requiredPermission?: string | null;
  children: React.ReactNode;
}
