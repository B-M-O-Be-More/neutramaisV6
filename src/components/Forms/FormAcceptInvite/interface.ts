import { InferType } from "yup";

import type { AcceptInviteFieldError } from "@/hooks/useAcceptInvite";
import { acceptInviteSchema } from "@/schemas/platformInvite";

export type AcceptInviteValues = InferType<typeof acceptInviteSchema>;

export interface FormAcceptInviteProps {
  onSubmit: (values: AcceptInviteValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Erro geral (chave de tradução). */
  formError?: string;
  /** Erro de um campo devolvido pela API (chave de tradução). */
  fieldError?: AcceptInviteFieldError;
}
