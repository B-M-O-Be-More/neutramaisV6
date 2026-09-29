import type {
  ProductOffering,
  SearchProductOfferingsParams,
} from "@/services/productCatalog.service";
import type { PaginationMetadata } from "@/types/api.types";

export type { ProductOffering, SearchProductOfferingsParams };

export interface UseProductOfferingsReturn {
  /** Ofertas da página atual (vazio enquanto carrega ou em erro). */
  offerings: ProductOffering[];
  /** Paginação do envelope; null até a primeira resposta. */
  pagination: PaginationMetadata | null;
  isLoading: boolean;
  /** True quando a última busca falhou. */
  hasError: boolean;
  /** Refaz a busca com os mesmos filtros. */
  refetch: () => void;
}
