import type { UseContractsReturn } from "@/hooks/useContracts";

export type UseContractActionsParams = Pick<
  UseContractsReturn,
  "pendingId" | "toggleAutoRenew" | "requestAmendment" | "requestCancellation"
>;

/** Props de ação que o card e o detalhe recebem. */
export interface ContractActionHandlers {
  isPending: boolean;
  onToggleAutoRenew: () => void;
  /** true quando o aditivo foi enviado. */
  onSubmitAmendment: (description: string) => Promise<boolean>;
  /** true quando o pedido de cancelamento foi registrado. */
  onConfirmCancellation: () => Promise<boolean>;
}
