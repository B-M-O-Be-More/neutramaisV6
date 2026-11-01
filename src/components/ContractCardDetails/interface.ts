import type { Contract } from "@/types/contracts";

export interface ContractCardDetailsProps {
  contract: Contract;
  locale: string;
  /** Base dos dias até a renovação ("237d"). */
  now: number;
  /** Ação do contrato em andamento. */
  isPending: boolean;
  onToggleAutoRenew: () => void;
  /** Envia o aditivo; true fecha o formulário. */
  onSubmitAmendment: (description: string) => Promise<boolean>;
  /** Confirma o cancelamento; true fecha a confirmação. */
  onConfirmCancellation: () => Promise<boolean>;
}
