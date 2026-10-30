import type { WalletTransaction } from "@/services/wallet.service";

export interface WalletRecentTransactionsProps {
  /** Lançamentos mais recentes já recortados para a lista. */
  transactions: WalletTransaction[];
  isLoading: boolean;
  /** Chave de tradução do erro de leitura. */
  error: string | null;
  onRetry: () => void;
  /** Página do histórico completo. */
  historyHref: string;
  /** Idioma dos valores e datas (ex.: "pt-BR"). */
  locale: string;
}
