/** Propostas diretas (a um seller) ou cotações em lote (RFQ). */
export type ProposalsTab = "direct" | "rfq";

export interface ProposalsTabsProps {
  value: ProposalsTab;
  onChange: (tab: ProposalsTab) => void;
}
