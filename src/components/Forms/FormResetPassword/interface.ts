import { InferType } from "yup";

import { resetPasswordSchema } from "@/schemas/resetPassword";

export type ResetPasswordValues = InferType<typeof resetPasswordSchema>;

export interface FormResetPasswordProps {
  /** Envia a nova senha já validada (mínimo 12 caracteres — RN-528). */
  onSubmit: (password: string) => void | Promise<void>;
  /** Erro inline devolvido pelo upstream (422 na política de senha). */
  formError?: string;
  isSubmitting?: boolean;
}
