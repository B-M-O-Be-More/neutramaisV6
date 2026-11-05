import type {
  SellerRfq,
  SellerRfqProposalDraft,
  SellerRfqStatus,
} from "@/types/sellerRfqs";

export interface UseSellerRfqsReturn {
  rfqs: SellerRfq[];
  /** RFQs por status, para os contadores da aba. */
  counts: Record<SellerRfqStatus, number>;
  /** RFQs recebidas no mês corrente. */
  monthReceived: number;
  /**
   * Envia a proposta (ou a próxima versão dela). Devolve a RFQ atualizada;
   * null quando ela já não está aberta.
   */
  sendProposal: (
    id: string,
    draft: SellerRfqProposalDraft,
  ) => Promise<SellerRfq | null>;
  /** Recusa a RFQ com justificativa; false quando ela já não aguarda. */
  decline: (id: string, reason: string) => Promise<boolean>;
}
