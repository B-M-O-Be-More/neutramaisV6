import type { DirectProposal } from "@/types/proposals";

export interface DirectProposalCardProps {
  proposal: DirectProposal;
  /** Idioma para moeda e datas. */
  locale: string;
  onView: () => void;
  onRevise: () => void;
  onCancel: () => void;
  /** Aceita: abre o pedido gerado. */
  onViewOrder: () => void;
}
