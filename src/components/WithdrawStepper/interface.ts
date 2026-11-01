export interface WithdrawStepperProps {
  /** Etapa atual: 0 Valor, 1 Destino, 2 Revisão, 3 Confirmação. */
  current: number;
  /** Saque concluído: todas as etapas marcadas. */
  isComplete?: boolean;
}
