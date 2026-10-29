export interface StepperProps {
  /** Títulos das etapas, na ordem. */
  steps: string[];
  /** Índice da etapa atual (0-based). */
  step: number;
  /** Disparado ao clicar em uma etapa do indicador (para voltar a etapas visitadas). */
  onStepClick?: (index: number) => void;
  /**
   * `default`: cadastro (círculo de 40px, título 16px, azul).
   * `compact`: assistentes da área autenticada (círculo de 28px, título 10px).
   */
  variant?: "default" | "compact";
  /** Cor da etapa atual e das concluídas. Padrão: azul Neutra (#1F5AFF). */
  accentColor?: string;
}
