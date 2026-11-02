import type { TrendingFilter } from "@/functions/offers";

export interface TrendingProductsProps {
  filter: TrendingFilter;
  onFilterChange: (filter: TrendingFilter) => void;
  /** Idioma dos preços (ex.: "pt-BR"). */
  locale: string;
}
