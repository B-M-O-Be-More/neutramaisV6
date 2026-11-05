import type {
  CategoryTemplateField,
  CategoryTemplateRule,
  ProductCategory,
} from "@/services/productCatalog.service";

export type { CategoryTemplateField, CategoryTemplateRule, ProductCategory };

export interface UseCategoryTemplateReturn {
  /** Categoria com o template; `null` sem categoria, carregando ou com erro. */
  category: ProductCategory | null;
  /** Template efetivo (herdados primeiro); vazio enquanto não carrega. */
  template: CategoryTemplateField[];
  /** Regras condicionais (só o que o Seller preenche). */
  rules: CategoryTemplateRule[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}
