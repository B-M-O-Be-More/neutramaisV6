import type { RfqDraft } from "@/types/proposals";

export interface RfqReviewSummaryProps {
  draft: RfqDraft;
  /** ID que a RFQ vai receber ao ser enviada. */
  rfqId: string;
}
