import type { SearchNetworkPromoCardProps } from "@/components/SearchNetworkPromoCard";

export interface SearchNetworkPromotion extends SearchNetworkPromoCardProps {
  id: string;
}

export interface SearchNetworkPromotionsProps {
  promotions: SearchNetworkPromotion[];
}
