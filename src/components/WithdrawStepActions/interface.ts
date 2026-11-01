export interface WithdrawStepActionsProps {
  /** Sem `onBack`, o "Voltar" aparece desabilitado (primeira etapa). */
  onBack?: () => void;
  nextLabel: string;
  onNext: () => void;
  nextDisabled?: boolean;
}
