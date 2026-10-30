import type { WalletBalance } from "@/services/wallet.service";

export interface UseWalletBalanceReturn {
  balance: WalletBalance | null;
  isLoading: boolean;
  /** Chave de tradução quando a leitura falhou. */
  error: string | null;
  reload: () => void;
}
