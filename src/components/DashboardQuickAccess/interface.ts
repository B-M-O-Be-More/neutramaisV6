export interface DashboardQuickAccessProps {
  /** Propostas aguardando resposta — contador do atalho de Propostas / RFQ. */
  pendingProposals?: number;
  /** Crédito Neutra+ já formatado — ex.: "R$ 24.744". */
  walletCredit: string;
}
