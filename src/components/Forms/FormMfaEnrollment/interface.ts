import { InferType } from "yup";

import { mfaTotpSchema } from "@/schemas/mfa";

export type MfaEnrollmentValues = InferType<typeof mfaTotpSchema>;

export interface FormMfaEnrollmentProps {
  /** Confirma o cadastro com o TOTP de 6 dígitos (string — preserva zeros). */
  onSubmit: (totpCode: string) => void | Promise<void>;
  /** Volta para os códigos de recuperação. */
  onBack: () => void;
  /** Erro recuperável da confirmação (código inválido, formato). */
  formError?: string;
  isSubmitting?: boolean;
}
