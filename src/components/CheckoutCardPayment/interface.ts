export interface CheckoutCardPaymentProps {
  /** Segredo do PaymentIntent devolvido pelo POST /payment. */
  clientSecret: string;
  /** Valor no cartão, já formatado. */
  amountLabel: string;
  /** O Stripe confirmou o cartão (ou pediu 3DS e voltou). */
  onConfirmed: () => void;
  /** O Stripe recusou: mensagem dele, quando houver. */
  onFailed: (message?: string) => void;
  /** Mensagem já traduzida do último erro. */
  error?: string;
}
