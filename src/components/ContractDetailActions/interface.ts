export interface ContractDetailActionsProps {
  autoRenew: boolean;
  cancellationRequested: boolean;
  /** Multa já formatada; null quando sair não gera multa. */
  exitFee: string | null;
  isPending: boolean;
  /** Abre o formulário de aditivo da seção "Change Requests". */
  onRequestAmendment: () => void;
  onToggleAutoRenew: () => void;
  /** true quando o pedido de cancelamento foi registrado. */
  onConfirmCancellation: () => Promise<boolean>;
}
