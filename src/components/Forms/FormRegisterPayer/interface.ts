import { InferType } from "yup";

import { registerPayerSchema } from "@/schemas/register";

export type RegisterPayerValues = InferType<typeof registerPayerSchema>;

export interface FormRegisterPayerProps {
  onSubmit?: (values: RegisterPayerValues) => void | Promise<void>;
}
