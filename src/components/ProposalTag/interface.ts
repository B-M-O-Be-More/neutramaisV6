import type { IconType } from "react-icons";

export type ProposalTagTone = "green" | "blue" | "amber" | "red";

export interface ProposalTagProps {
  tone: ProposalTagTone;
  label: string;
  icon?: IconType;
  /** `md`: um pouco maior, no cabeçalho dos modais (KYC Verificado, URGENTE). */
  size?: "sm" | "md";
}
