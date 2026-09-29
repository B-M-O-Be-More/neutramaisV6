import type {
  ListOrganizationOfferingsParams,
  ProductOffering,
} from "@/services/productCatalog.service";
import type { PaginationMetadata } from "@/types/api.types";

export type { ListOrganizationOfferingsParams, ProductOffering };

export interface UseOrganizationOfferingsReturn {
  /** Ofertas da página atual (vazio enquanto carrega ou em erro). */
  offerings: ProductOffering[];
  /** Paginação do envelope; null até a primeira resposta. */
  pagination: PaginationMetadata | null;
  isLoading: boolean;
  /** True quando a última requisição falhou (inclui 403 sem sessão). */
  hasError: boolean;
  /** Refaz a requisição com a mesma paginação. */
  refetch: () => void;
}
