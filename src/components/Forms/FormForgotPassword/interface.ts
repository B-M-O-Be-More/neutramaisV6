import { InferType } from "yup";

import { forgotPasswordSchema } from "@/schemas/forgotPassword";

export type ForgotPasswordValues = InferType<typeof forgotPasswordSchema>;

export interface FormForgotPasswordProps {
  /** E-mail para pré-preencher o campo (usado ao voltar do estado de erro). */
  defaultEmail?: string;
  /** Dispara a solicitação do link; recebe o e-mail já validado. */
  onSubmit: (email: string) => void | Promise<void>;
}
