import type { WithdrawalMode } from "@/services/withdrawal.service";

export interface WithdrawAmountStepProps {
  /** Saldo disponível para saque; null enquanto carrega ou em erro. */
  availableMinor: number | null;
  isLoadingBalance: boolean;
  /** Falha ao ler o saldo (já traduzida). */
  balanceError?: string | null;
  currency: string;
  /** Idioma dos valores (ex.: "pt-BR"). */
  locale: string;
  amountMinor: number;
  mode: WithdrawalMode;
  onAmountChange: (amountMinor: number) => void;
  onModeChange: (mode: WithdrawalMode) => void;
  onNext: () => void;
}
