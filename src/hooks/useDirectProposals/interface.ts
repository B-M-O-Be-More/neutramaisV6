import type {
  DirectProposal,
  DirectProposalRevision,
  DirectProposalStatus,
  ProposalCancelReason,
} from "@/types/proposals";

export interface UseDirectProposalsReturn {
  proposals: DirectProposal[];
  /** Propostas por status, para os contadores das abas. */
  counts: Record<DirectProposalStatus, number>;
  /** Proposta com ação em andamento; null quando nenhuma. */
  pendingId: string | null;
  /** Envia a revisão; devolve a proposta na nova versão (null se negada). */
  revise: (
    id: string,
    revision: DirectProposalRevision,
  ) => Promise<DirectProposal | null>;
  cancel: (
    id: string,
    reason: ProposalCancelReason,
    notes: string,
  ) => Promise<boolean>;
}
