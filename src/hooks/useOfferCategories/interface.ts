import type {
  OfferCategoryIndex,
  OfferCategoryNode,
} from "@/functions/offerCategoryTree";

export type { OfferCategoryIndex, OfferCategoryNode };

export interface UseOfferCategoriesReturn extends OfferCategoryIndex {
  /** true até a primeira resposta da API. */
  isLoading: boolean;
  /** A árvore falhou: `roots` são as famílias fixas, sem subcategorias. */
  hasError: boolean;
  refetch: () => void;
}
