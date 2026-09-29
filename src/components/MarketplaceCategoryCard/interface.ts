import type { IconType } from "react-icons";

/** Paletas disponíveis para o card de categoria. */
export type MarketplaceCategoryTone = "blue" | "violet" | "emerald" | "amber";

export interface MarketplaceCategoryCardProps {
  /** Ícone da categoria, exibido no quadro superior esquerdo. */
  icon: IconType;
  /** Nome da categoria. */
  title: string;
  /** Resumo do que a categoria contempla. */
  description: string;
  /** Chips com os tipos de oferta da categoria. */
  tags: string[];
  /**
   * Texto do rodapé, já formatado — ex.: "1.243 ofertas", "892 SKUs".
   * A unidade varia por categoria, então o texto chega pronto.
   */
  footerLabel: string;
  /** Paleta do card (fundo, borda e cor do selo). */
  tone: MarketplaceCategoryTone;
  /** Destino ao clicar no card. */
  href: string;
  /** Selo opcional no canto superior direito — ex.: "Mais buscado". */
  badge?: string;
  /** Enquanto true, exibe um esqueleto no lugar do rodapé. */
  isLoading?: boolean;
}
