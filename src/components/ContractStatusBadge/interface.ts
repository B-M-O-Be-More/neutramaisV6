import type { ContractStatus } from "@/types/contracts";

export interface ContractStatusBadgeProps {
  status: ContractStatus;
  /** `sm`: card da lista. `md`: cabeçalho do detalhe. */
  size?: "sm" | "md";
}
