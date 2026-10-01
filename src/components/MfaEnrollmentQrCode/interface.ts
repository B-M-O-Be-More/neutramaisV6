export interface MfaEnrollmentQrCodeProps {
  /** URI `otpauth://totp/...` — o QR é gerado localmente a partir dela. */
  otpauthUri: string;
  /** Chave base32 para cadastro manual no autenticador. */
  manualKey: string;
  /** Segue para os códigos de recuperação. */
  onNext: () => void;
  /** Desiste do cadastro e volta às credenciais, descartando os segredos. */
  onBack: () => void;
}
