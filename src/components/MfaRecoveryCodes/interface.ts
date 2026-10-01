export interface MfaRecoveryCodesProps {
  /** Códigos devolvidos pelo /mfa/enroll — a quantidade vem do servidor. */
  codes: string[];
  /** Confirmação visual de que os códigos foram guardados. */
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
  /** Segue para a validação do TOTP — só com `saved` marcado. */
  onNext: () => void;
  /** Volta para o QR code. */
  onBack: () => void;
}
