export interface SellerOffersStatsData {
  /** Valores já formatados; null mostra "—" (sem dado ou carregando). */
  totalOffers: string | null;
  views: string | null;
  orders: string | null;
  revenue: string | null;
  /** Legenda do card de total (ex.: "3 publicadas"). */
  totalCaption?: string;
}

export interface SellerOffersStatsProps {
  data: SellerOffersStatsData;
}
