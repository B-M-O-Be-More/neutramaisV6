import type { ContractActionHandlers } from "@/hooks/useContractActions";

export interface ContractDetailActionsProps extends ContractActionHandlers {
  /** Pedido que originou o contrato ("Ver pedido"). */
  orderId: string;
}
