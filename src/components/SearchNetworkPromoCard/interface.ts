/** Paletas do card de campanha. */
export type SearchNetworkPromoTone = "blue" | "violet" | "emerald" | "amber";

export interface SearchNetworkPromoCardProps {
  /** Emoji ao lado do selo — ex.: "🔥". */
  emoji: string;
  badge: string;
  title: string;
  description: string;
  href: string;
  tone: SearchNetworkPromoTone;
}
