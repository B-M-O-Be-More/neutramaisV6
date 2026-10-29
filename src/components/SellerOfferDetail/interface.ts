import type { ProductOffering } from "@/services/productCatalog.service";

export interface SellerOfferDetailProps {
  offering: ProductOffering;
  /** Nome do plano (productSpecification) — define a categoria. */
  specificationName?: string;
  /** Idioma para moeda e datas (ex.: "pt-BR"). */
  locale: string;
  /** Patrocínio sendo ligado/desligado. */
  isPromoting?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onTogglePromotion: () => void;
}
