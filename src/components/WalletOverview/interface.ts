export type WalletVariant = "buyer" | "seller";

export interface WalletOverviewProps {
  /**
   * buyer: saldo, métodos de pagamento e histórico. seller: acrescenta o aviso
   * de recebimentos, antecipação/payout e as contas de recebimento.
   */
  variant: WalletVariant;
  /** Idioma dos valores e datas (ex.: "pt-BR"). */
  locale: string;
  /** Hoje — fixa o "mês" dos totais nos testes. */
  now?: Date;
}
