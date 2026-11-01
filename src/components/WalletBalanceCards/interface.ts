/** Indicador já formatado. `value` null mostra "—" (ainda sem endpoint). */
export interface WalletIndicator {
  value: string | null;
  caption: string;
  /** Esqueleto no lugar do valor enquanto a fonte carrega. */
  isLoading?: boolean;
  /** Rótulo e ajuda no lugar dos padrões (ex.: os do seller). */
  label?: string;
  help?: string;
  /** Valor negativo: em vermelho, com o card de alerta (Figma 3084-45182). */
  negative?: boolean;
}

export interface WalletBalanceCardsData {
  /** Saldo livre, arredondado ("R$ 24.744"). */
  available: WalletIndicator;
  escrow: WalletIndicator;
  dispute: WalletIndicator;
  /** Crédito Neutra+ com centavos ("R$ 24.744,03"); a legenda vem acima. */
  credit: WalletIndicator;
  monthCredited: WalletIndicator;
  monthSpent: WalletIndicator;
  escrowNow: WalletIndicator;
}

export interface WalletBalanceCardsProps {
  data: WalletBalanceCardsData;
}
