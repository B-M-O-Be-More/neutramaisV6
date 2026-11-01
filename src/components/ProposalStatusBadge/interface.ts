import type { ProposalStatusStyle } from "@/data/proposalStatus";

export interface ProposalStatusBadgeProps {
  /** Cores e ícone do status (DIRECT_PROPOSAL_STATUS_STYLES / RFQ_STATUS_STYLES). */
  status: ProposalStatusStyle;
  label: string;
  /**
   * `sm`: card de proposta (11px, com ícone).
   * `md`: card de RFQ (12px, com ícone).
   * `lg`: cabeçalho do modal (12px, sem ícone).
   */
  size?: "sm" | "md" | "lg";
}
