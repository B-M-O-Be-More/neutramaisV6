import type { CheckoutOutcome } from "@/hooks/useCheckoutFlow";

export interface CheckoutResultProps {
  /** null enquanto o pagamento é acompanhado. */
  outcome: CheckoutOutcome | null;
  /** Números dos pedidos criados (curtos). */
  orderNumbers: string[];
  /** Total do checkout, já formatado. */
  totalLabel: string;
  /** Tenta de novo depois de um erro. */
  onRetry: () => void;
}
