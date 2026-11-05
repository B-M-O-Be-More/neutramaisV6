import type { TrendingCategory } from "@/functions/offers";

export interface OffersHeroProps {
  /** Atalho escolhido: filtra "Produtos em alta" pela categoria. */
  onSelectCategory: (category: TrendingCategory) => void;
}
