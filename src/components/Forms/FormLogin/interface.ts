import { InferType } from "yup";

import { loginSchema } from "@/schemas/login";
import type { CredentialsInput } from "@/hooks/useLogin";

export type LoginValues = InferType<typeof loginSchema>;

export interface FormLoginProps {
  /**
   * Dispara a autenticação. Recebe as credenciais validadas mais o token do
   * hCaptcha, quando o desafio estiver ativo.
   */
  onSubmit: (values: CredentialsInput) => void | Promise<void>;
  /** Erro genérico do fluxo (credenciais inválidas, validação do upstream). */
  formError?: string;
  /** Request em voo — controlado pelo useLogin. */
  isSubmitting?: boolean;
  /**
   * Exibe o desafio hCaptcha e bloqueia o envio até que seja resolvido. Ligado
   * pelo useLogin a partir da 3ª tentativa falha.
   */
  captchaRequired?: boolean;
}
