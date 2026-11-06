export interface CheckoutStepperProps {
  /** Passo atual, de 1 a 5. */
  current: number;
  /** Rótulos na ordem dos passos. */
  labels: string[];
  /** Volta a um passo já feito; ausente quando não dá para voltar. */
  onSelect?: (step: number) => void;
}
