export interface SellerRfqStatsData {
  monthReceived: number;
  /** Aguardando a proposta do seller. */
  pending: number;
  withProposal: number;
  converted: number;
  /** Recusadas pelo seller ou expiradas. */
  closed: number;
}

export interface SellerRfqStatsProps {
  data: SellerRfqStatsData;
  locale: string;
}
