import type { ProposalCancelValues } from "@/schemas/proposals";

export type { ProposalCancelValues };

export interface FormProposalCancelProps {
  isSubmitting: boolean;
  onSubmit: (values: ProposalCancelValues) => void;
  /** "Manter proposta": fecha sem cancelar. */
  onKeep: () => void;
}
