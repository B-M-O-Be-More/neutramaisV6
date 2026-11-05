import type {
  OfferingImage,
  ProductOffering,
} from "@/services/productCatalog.service";

export interface SellerOfferDetailProps {
  offering: ProductOffering;
  /** Nome do plano (productSpecification) — define a categoria. */
  specificationName?: string;
  /** Imagens confirmadas, na ordem da oferta (a primeira é a capa). */
  images?: OfferingImage[];
  /** Idioma para moeda e datas (ex.: "pt-BR"). */
  locale: string;
  /** Patrocínio sendo ligado/desligado. */
  isPromoting?: boolean;
  onBack: () => void;
  onEdit: () => void;
  /** Abre a edição na área de cobertura; sem ela, vale `onEdit`. */
  onEditCoverage?: () => void;
  onTogglePromotion: () => void;
}
