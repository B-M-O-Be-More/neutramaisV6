export interface MfaEnrollmentIntroProps {
  /** Troca a credencial do login + senha pelos segredos do autenticador. */
  onStart: () => void | Promise<void>;
  /** Desiste do cadastro, descarta a credencial e volta às credenciais. */
  onBack: () => void;
  isSubmitting?: boolean;
}
