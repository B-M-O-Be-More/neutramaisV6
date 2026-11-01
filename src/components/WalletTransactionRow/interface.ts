import type { WalletTransactionStatus } from "@/functions/walletTransactions";

/** Cor e ícone da linha: entrada, saída, escrow ou liberação de escrow. */
export type WalletTransactionTone = "credit" | "debit" | "escrow" | "release";

export interface WalletTransactionRowProps {
  tone: WalletTransactionTone;
  title: string;
  /** Data já formatada. */
  date: string;
  /** Referência (pedido) exibida depois da data. */
  reference?: string;
  /** Valor já formatado, com o sinal. */
  amount: string;
  /** Selo de situação — só no histórico completo. */
  status?: WalletTransactionStatus;
  /** "compact": lista da carteira; "regular": página de histórico. */
  size?: "compact" | "regular";
  /** Sem a borda inferior (última linha da lista). */
  isLast?: boolean;
}
