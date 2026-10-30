import type { Rfq, RfqDraft } from "@/types/proposals";

/**
 * Guarda a etapa e o rascunho: monte com uma `key` nova a cada abertura para
 * começar do zero.
 */
export interface RfqCreateDialogProps {
  open: boolean;
  /** ID que a RFQ vai receber (exibido na revisão). */
  nextId: string;
  /** Refazer uma RFQ (expirada/cancelada): começa em Detalhes, preenchido. */
  initial?: RfqDraft;
  onClose: () => void;
  /** Envia a RFQ aos sellers elegíveis. */
  onCreate: (draft: RfqDraft) => Promise<Rfq>;
}
