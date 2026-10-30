import type { PaymentMethodType } from "@/schemas/paymentMethod";

export interface WalletAddPaymentMethodProps {
  /** Volta para a carteira (buyer ou seller). */
  backHref: string;
  /** Tipo selecionado ao abrir. */
  initialType?: PaymentMethodType;
}
