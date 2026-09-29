import type { SearchProductOfferingsParams } from "@/services/productCatalog.service";

export interface MarketplaceOffersProps {
  /** Filtros da busca. Default: primeira página com 6 ofertas. */
  filters?: SearchProductOfferingsParams;
}
