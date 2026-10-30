import type { OfferCategory } from "@/data/offerCategories";

export interface OfferCategoryPickerProps {
  value: OfferCategory | null;
  onChange: (category: OfferCategory) => void;
  /** Mensagem de erro (já traduzida) quando nenhuma categoria foi escolhida. */
  error?: string;
}
