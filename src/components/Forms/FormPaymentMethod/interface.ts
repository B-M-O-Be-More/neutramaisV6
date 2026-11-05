import type {
  PaymentMethodType,
  PaymentMethodValues,
} from "@/schemas/paymentMethod";

export interface FormPaymentMethodProps {
  /** Tipo selecionado ao abrir (ex.: PIX para conta de recebimento). */
  initialType?: PaymentMethodType;
  isSubmitting?: boolean;
  /** Recebe os dados já validados. */
  onSubmit: (values: PaymentMethodValues) => void;
  onCancel: () => void;
}
