export interface DashboardSellerPerformanceData {
  /** Nota média de 0 a 5 — ex.: 4.8. */
  rating: number;
  reviewCount: number;
  /** Percentuais de 0 a 100. */
  acceptanceSla: number;
  onTimeDelivery: number;
}

export interface DashboardSellerPerformanceProps {
  data: DashboardSellerPerformanceData;
  /** Destino do "Ver relatório completo". */
  reportHref: string;
}
