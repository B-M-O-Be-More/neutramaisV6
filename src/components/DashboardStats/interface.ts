/**
 * Indicadores da conta no início da área autenticada. Os valores principais já
 * chegam formatados (moeda, milhar); as contagens das legendas são números
 * para o i18n montar a frase.
 */
export interface DashboardStatsData {
  /** Pedidos ativos — ex.: "300". */
  activeOrders: string;
  ordersInProgress: number;
  /** RFQs abertas — ex.: "5". */
  openRfqs: string;
  rfqsWithProposal: number;
  /** Crédito Neutra+ disponível — ex.: "R$ 204.744". */
  availableCredit: string;
  /** Contratos ativos — ex.: "2". */
  activeContracts: string;
  renewingContracts: number;
  /** Dias até a próxima renovação de contrato. */
  nextRenewalDays: number;
}

export interface DashboardStatsProps {
  data: DashboardStatsData;
}
