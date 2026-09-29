/**
 * Resumo do dia exibido no banner do início da área autenticada, já formatado
 * para exibição. A formatação (moeda, abreviações) fica na camada que consome
 * a API, mantendo o componente apresentacional.
 */
export interface DashboardHeroData {
  /** Primeiro nome do usuário logado — ex.: "Maria". */
  firstName: string;
  /** Total de ações que pedem atenção hoje. */
  pendingActions: number;
  /** Quantos SLAs estão em estado crítico. */
  criticalSlas: number;
  /** Propostas aguardando resposta do usuário. */
  awaitingProposals: number;
  /** Destaques à direita do banner — ex.: "3", "R$ 24k", "4.8". */
  activeOrders: string;
  openRfqs: string;
  credit: string;
  sellerScore: string;
}

export interface DashboardHeroProps {
  data: DashboardHeroData;
}
