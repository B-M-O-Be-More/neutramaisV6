import type { CampaignOffer } from "@/types/offers";

export interface OfferCampaignCardProps {
  offer: CampaignOffer;
  /** Base do "Expira em…". */
  now: number;
  /** Destino de "Ver Oferta". */
  href: string;
}
