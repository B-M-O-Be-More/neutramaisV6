import { InferType } from "yup";

import { documentRejectSchema } from "@/schemas/kycReview";

export type KycDocumentRejectValues = InferType<typeof documentRejectSchema>;

export interface FormKycDocumentRejectProps {
  /** Requisito sem arquivo: o único motivo aceito é `missing_document`. */
  notSubmitted: boolean;
  /** Envia a recusa; true fecha o formulário. */
  onSubmit: (values: KycDocumentRejectValues) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting?: boolean;
}
