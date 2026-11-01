import type {
  OfferingStatus,
  ProductSpecification,
} from "@/services/productCatalog.service";

export type SellerOffersStatusFilter = OfferingStatus | "all";

export interface SellerOffersFiltersValue {
  /** Parte do nome da oferta. */
  search: string;
  /** Especificação (categoria); vazio = todas. */
  specificationId: string;
  status: SellerOffersStatusFilter;
}

export interface SellerOffersFiltersProps {
  value: SellerOffersFiltersValue;
  onChange: (value: SellerOffersFiltersValue) => void;
  specifications: ProductSpecification[];
  /** Ofertas por status (do resumo); ausente ou zero = contador oculto. */
  counts?: Partial<Record<OfferingStatus, number>>;
}
