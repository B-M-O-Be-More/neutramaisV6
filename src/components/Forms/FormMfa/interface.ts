import { InferType } from "yup";

import type { MfaInput } from "@/hooks/useLogin";
import { mfaRecoverySchema, mfaTotpSchema } from "@/schemas/mfa";

export type MfaTotpValues = InferType<typeof mfaTotpSchema>;
export type MfaRecoveryValues = InferType<typeof mfaRecoverySchema>;

/** Qual dos dois fatores o usuário está usando no momento. */
export type MfaMode = "totp" | "recovery";

export interface FormMfaProps {
  /** Envia o código; preenche exatamente um de totpCode | recoveryCode. */
  onSubmit: (values: MfaInput) => void | Promise<void>;
  /** Abandona o desafio e volta à tela de credenciais. */
  onBack: () => void;
  /** Erro do desafio (INVALID_MFA_CODE) — não distingue TOTP de recovery. */
  formError?: string;
  isSubmitting?: boolean;
}
