export type SellerOrderTimelineState = "done" | "current" | "pending";

export interface SellerOrderTimelineStep {
  key: string;
  /** Texto já traduzido. */
  label: string;
  state: SellerOrderTimelineState;
}

export interface SellerOrderTimelineProps {
  title: string;
  steps: SellerOrderTimelineStep[];
}
