export interface CheckoutVerificationStepProps {
  isPending: boolean;
  /** Mensagem já traduzida do último erro. */
  error?: string;
  /** Mostra o link para cadastrar o autenticador no perfil. */
  needsEnrollment?: boolean;
  onSubmit: (code: string) => void;
  onCancel: () => void;
}
