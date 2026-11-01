import type { ReactNode } from "react";

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
  /**
   * À direita do título, no lugar do "Ver tudo" (ex.: a moeda do histórico
   * na carteira do seller, Figma 3084-45032).
   */
  headerEnd?: ReactNode;
}
