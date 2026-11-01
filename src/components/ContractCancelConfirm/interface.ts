export interface ContractCancelConfirmProps {
  /** Multa já formatada ("R$ 329,97"); null quando sair não gera multa. */
  exitFee: string | null;
  isSubmitting: boolean;
  /** "Voltar": desiste do cancelamento. */
  onBack: () => void;
  onConfirm: () => void;
}
