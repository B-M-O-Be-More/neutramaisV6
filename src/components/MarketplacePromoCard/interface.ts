import type { IconType } from "react-icons";

/** Paletas disponíveis para o card promocional. */
export type MarketplacePromoTone = "blue" | "violet" | "emerald";

export interface MarketplacePromoCardProps {
  /** Ícone exibido no quadro translúcido ao lado do selo. */
  icon: IconType;
  /** Selo da campanha — exibido em caixa alta (ex.: "Promoção relâmpago"). */
  badge: string;
  /** Chamada principal da campanha. */
  title: string;
  /** Condições ou detalhes da campanha. */
  description: string;
  /** Texto do botão de ação. */
  ctaLabel: string;
  /** Destino do botão de ação. */
  href: string;
  /** Paleta do card (gradiente de fundo e cor do texto do botão). */
  tone: MarketplacePromoTone;
}
