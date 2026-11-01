import type { OfferLifecycleGates } from "@/functions/offerLifecycleGates";
import type {
  OfferingAction,
  ProductOffering,
} from "@/services/productCatalog.service";

export interface SellerOfferCardProps {
  offering: ProductOffering;
  /** Nome da especificação (categoria) da oferta, quando conhecido. */
  categoryName?: string;
  /** Idioma para moeda e data (ex.: "pt-BR"). */
  locale: string;
  /** Transição desta oferta em andamento — trava as ações. */
  isPending?: boolean;
  /**
   * Permissões e KYC do contexto do perfil. Ausente, todas as ações aparecem
   * e vale a resposta da marketplace-api.
   */
  gates?: OfferLifecycleGates;
  onAction: (action: OfferingAction) => void;
}
