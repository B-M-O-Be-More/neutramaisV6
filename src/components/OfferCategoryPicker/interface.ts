import type { OfferCategoryNode } from "@/functions/offerCategoryTree";

export interface OfferCategoryPickerProps {
  /** Categorias raiz da plataforma (`useOfferCategories`). */
  options: OfferCategoryNode[];
  /** Id da raiz escolhida. */
  value: string | null;
  onChange: (root: OfferCategoryNode) => void;
  /** Mensagem de erro (já traduzida) quando nenhuma categoria foi escolhida. */
  error?: string;
}
