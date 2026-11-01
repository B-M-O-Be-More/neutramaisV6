import type { ContractCardDetailsProps } from "@/components/ContractCardDetails";
import type { Contract } from "@/types/contracts";

export interface ContractCardProps extends Pick<
  ContractCardDetailsProps,
  | "isPending"
  | "onToggleAutoRenew"
  | "onSubmitAmendment"
  | "onConfirmCancellation"
> {
  contract: Contract;
  locale: string;
  /** Base do prazo de renovação ("renova em 6d"). */
  now: number;
  /** Termos e ações do contrato visíveis abaixo do card. */
  expanded: boolean;
  onToggle: () => void;
}
