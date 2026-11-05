import type { DirectProposal } from "@/types/proposals";

export interface DirectProposalDetailsDialogProps {
  /** Proposta exibida; null fecha o modal. */
  proposal: DirectProposal | null;
  /** Idioma para moeda e datas. */
  locale: string;
  onClose: () => void;
  onRevise: (proposal: DirectProposal) => void;
  onCancel: (proposal: DirectProposal) => void;
}
