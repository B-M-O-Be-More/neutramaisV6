import type {
  PayoutAccount,
  WithdrawalMode,
} from "@/services/withdrawal.service";

export interface WithdrawReceiptProps {
  protocol: string;
  /** Valor líquido transferido, já formatado. */
  netAmount: string;
  account: PayoutAccount;
  mode: WithdrawalMode;
  /** Volta para a carteira. */
  walletHref: string;
}
