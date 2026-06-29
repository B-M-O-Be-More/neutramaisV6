import { InferType } from "yup";

import { loginSchema } from "@/schemas/login";

export type LoginValues = InferType<typeof loginSchema>;

export interface FormLoginProps {
  /** Callback de submit; recebe os valores validados do formulário. */
  onSubmit?: (values: LoginValues) => void | Promise<void>;
}
