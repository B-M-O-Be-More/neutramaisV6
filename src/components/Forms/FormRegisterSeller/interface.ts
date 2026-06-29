import { InferType } from "yup";

import { registerSellerSchema } from "@/schemas/register";

export type RegisterSellerValues = InferType<typeof registerSellerSchema>;

export interface FormRegisterSellerProps {
  onSubmit?: (values: RegisterSellerValues) => void | Promise<void>;
}
