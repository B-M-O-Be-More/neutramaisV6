import type { ForYouOffer } from "@/types/offers";

export interface OfferForYouCardProps {
  items: ForYouOffer[];
  /** Destino de cada oferta da lista. */
  href: string;
}
