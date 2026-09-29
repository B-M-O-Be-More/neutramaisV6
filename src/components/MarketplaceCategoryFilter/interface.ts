import type { MarketplaceCategoryKey } from "@/components/MarketplaceCategories/interface";

/** Valor do filtro: uma categoria ou "all" para não filtrar. */
export type MarketplaceCategoryFilterValue = MarketplaceCategoryKey | "all";

export interface MarketplaceCategoryFilterProps {
  /** Opção selecionada. */
  value: MarketplaceCategoryFilterValue;
  /** Disparado ao escolher outra opção. */
  onChange: (value: MarketplaceCategoryFilterValue) => void;
}
