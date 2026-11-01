import type { PayoutAccount } from "@/services/withdrawal.service";

export interface WithdrawDestinationStepProps {
  accounts: PayoutAccount[];
  selectedId: string | null;
  onSelect: (accountId: string) => void;
  /** Cadastro de uma nova conta de recebimento. */
  addHref: string;
  onBack: () => void;
  onNext: () => void;
}
