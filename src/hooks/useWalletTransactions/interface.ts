import type {
  WalletCurrency,
  WalletTransaction,
} from "@/services/wallet.service";

export interface UseWalletTransactionsOptions {
  currency?: WalletCurrency;
  /** Lançamentos por página (1–100). */
  limit?: number;
}

export interface UseWalletTransactionsReturn {
  /** Páginas carregadas até agora, do mais novo ao mais antigo. */
  transactions: WalletTransaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  /** Chave de tradução quando a primeira página falhou. */
  error: string | null;
  /** Há lançamentos mais antigos para carregar. */
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}
