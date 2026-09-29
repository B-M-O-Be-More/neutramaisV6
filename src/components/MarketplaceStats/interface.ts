/**
 * Métricas da home do marketplace, já formatadas para exibição.
 * A origem é a API; a formatação (moeda, percentual, duração) acontece na
 * camada que consome o endpoint, mantendo os componentes apresentacionais.
 */
export interface MarketplaceStatsData {
  /** Volume transacionado no período — ex.: "R$ 142M". */
  transactedVolume: string;
  /** Provedores ativos e verificados — ex.: "2.418". */
  activeProviders: string;
  /** Percentual de SLA cumprido — ex.: "98,2%". */
  slaCompliance: string;
  /** Tempo médio até o aceite do pedido — ex.: "2m 47s". */
  averageResponseTime: string;
}

export interface MarketplaceStatsProps {
  /** Métricas vindas da API. Ausentes, os cards exibem o esqueleto. */
  data?: MarketplaceStatsData;
  /** Força o estado de carregamento enquanto a requisição está em voo. */
  isLoading?: boolean;
}
