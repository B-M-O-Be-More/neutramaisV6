import type { ProposalCancelValues } from "@/schemas/proposals";
import type { DirectProposal } from "@/types/proposals";

export interface DirectProposalCancelDialogProps {
  /** Proposta a cancelar; null fecha o modal. */
  proposal: DirectProposal | null;
  isPending: boolean;
  onClose: () => void;
  /** Cancela; true fecha o modal. */
  onConfirm: (values: ProposalCancelValues) => Promise<boolean>;
}
