import type { DirectProposal, DirectProposalRevision } from "@/types/proposals";

/**
 * Guarda a etapa e o rascunho: monte com `key` = id da proposta para começar
 * do zero a cada abertura.
 */
export interface DirectProposalReviseDialogProps {
  /** Proposta em revisão; null fecha o modal. */
  proposal: DirectProposal | null;
  /** Idioma para moeda. */
  locale: string;
  isPending: boolean;
  onClose: () => void;
  /** Envia a nova versão; true fecha o modal. */
  onSubmit: (revision: DirectProposalRevision) => Promise<boolean>;
}
