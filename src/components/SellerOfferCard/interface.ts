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
  onAction: (action: OfferingAction) => void;
}
