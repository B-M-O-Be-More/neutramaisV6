export interface AdminStatsData {
  activeSellers: string;
  /** Organizações aguardando revisão; null enquanto carrega. */
  kycQueue: number | null;
  volume30d: string;
  openDisputes: string;
}

export interface AdminStatsProps {
  data: AdminStatsData;
}
