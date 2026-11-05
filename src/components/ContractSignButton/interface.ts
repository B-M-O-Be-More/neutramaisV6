import type { ContractActionHandlers } from "@/hooks/useContractActions";

export interface ContractSignButtonProps extends Pick<
  ContractActionHandlers,
  "signAction" | "isSigning" | "onSign"
> {
  /** Largura toda (card "Ações" do detalhe). */
  block?: boolean;
}
