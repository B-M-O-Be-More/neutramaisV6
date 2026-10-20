import { InferType } from "yup";

import type { AcceptPlatformInviteFieldError } from "@/hooks/useAcceptPlatformInvite";
import { acceptPlatformInviteSchema } from "@/schemas/platformInvite";

export type AcceptPlatformInviteValues = InferType<
  typeof acceptPlatformInviteSchema
>;

export interface FormAcceptPlatformInviteProps {
  onSubmit: (values: AcceptPlatformInviteValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Erro geral (chave de tradução). */
  formError?: string;
  /** Erro de um campo devolvido pela API (chave de tradução). */
  fieldError?: AcceptPlatformInviteFieldError;
}
