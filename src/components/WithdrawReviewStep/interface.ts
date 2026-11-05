import type { WithdrawalBreakdown } from "@/functions/withdrawal";
import type {
  PayoutAccount,
  WithdrawalMode,
} from "@/services/withdrawal.service";

export interface WithdrawReviewStepProps {
  breakdown: WithdrawalBreakdown;
  mode: WithdrawalMode;
  account: PayoutAccount;
  currency: string;
  /** Idioma dos valores (ex.: "pt-BR"). */
  locale: string;
  onBack: () => void;
  onConfirm: () => void;
}
