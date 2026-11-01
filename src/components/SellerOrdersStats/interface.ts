export interface SellerOrdersStatsData {
  monthTotal: number;
  awaiting: number;
  accepted: number;
  withIssue: number;
}

export interface SellerOrdersStatsProps {
  data: SellerOrdersStatsData;
  locale: string;
}
