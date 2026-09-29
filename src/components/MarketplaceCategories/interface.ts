/** Chaves das categorias do MVP — casam com as chaves de i18n. */
export type MarketplaceCategoryKey =
  | "connectivity"
  | "infrastructure"
  | "hardware"
  | "numbering";

/**
 * Contagem de itens por categoria, já formatada para exibição (ex.: "1.243").
 * A unidade ("ofertas", "SKUs", "blocos") vem do i18n de cada categoria.
 */
export type MarketplaceCategoryCounts = Record<MarketplaceCategoryKey, string>;

export interface MarketplaceCategoriesProps {
  /** Contagens vindas da API. Ausentes, os rodapés exibem o esqueleto. */
  counts?: MarketplaceCategoryCounts;
  /** Força o estado de carregamento enquanto a requisição está em voo. */
  isLoading?: boolean;
}
