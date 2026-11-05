import type { ContractActionHandlers } from "@/hooks/useContractActions";
import type { OrderContract } from "@/types/contracts";

export interface ContractSignaturePanelProps extends Pick<
  ContractActionHandlers,
  "signAction" | "isSigning" | "onSign"
> {
  contract: OrderContract;
  /** Usuário da sessão: diz se o signatário vinculado é ele. */
  currentUserId: string | null;
  /** Lê o contrato de novo. */
  onRefresh: () => void;
}
