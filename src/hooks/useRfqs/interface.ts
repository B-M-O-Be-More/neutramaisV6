import type { Rfq, RfqDraft, RfqStatus } from "@/types/proposals";

export interface UseRfqsReturn {
  rfqs: Rfq[];
  /** RFQs por status, para os contadores das abas. */
  counts: Record<RfqStatus, number>;
  /** ID que a próxima RFQ vai receber (exibido na revisão antes do envio). */
  nextId: string;
  /** Envia a RFQ a todos os sellers elegíveis da categoria. */
  create: (draft: RfqDraft) => Promise<Rfq>;
  /** Cancela as RFQs informadas; devolve quantas foram canceladas. */
  cancel: (ids: string[]) => Promise<number>;
}
