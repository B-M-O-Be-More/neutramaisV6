export interface StepperProps {
  /** Títulos das etapas, na ordem. */
  steps: string[];
  /** Índice da etapa atual (0-based). */
  step: number;
  /** Disparado ao clicar em uma etapa do indicador (para voltar a etapas visitadas). */
  onStepClick?: (index: number) => void;
}
