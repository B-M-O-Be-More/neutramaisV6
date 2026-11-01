import type {
  PayoutAccount,
  WithdrawalReceipt,
  WithdrawalRequest,
} from "@/services/withdrawal.service";

export interface SellerWithdrawProps {
  /** Contas de recebimento (destinos); vazia enquanto não há API de contas. */
  accounts: PayoutAccount[];
  /** Volta para a carteira. */
  walletHref: string;
  /** Cadastro de uma nova conta de recebimento. */
  addAccountHref: string;
  /** Idioma dos valores (ex.: "pt-BR"). */
  locale: string;
  /** Envio do saque; padrão: `withdrawalService.request`. */
  request?: (input: WithdrawalRequest) => Promise<WithdrawalReceipt>;
}
