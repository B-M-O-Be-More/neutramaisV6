export interface WithdrawPinStepProps {
  /** Valor líquido a receber, já formatado. */
  netAmount: string;
  isSubmitting: boolean;
  /** Erro da autorização (já traduzido). */
  error?: string | null;
  onBack: () => void;
  /** Código de 6 dígitos do app autenticador (TOTP). */
  onAuthorize: (totp: string) => void;
}
