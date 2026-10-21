import { InferType } from "yup";

import { accountDecisionSchema } from "@/schemas/kycReview";
import type { KycAccountDecision } from "@/services/adminKycReview.service";

export type KycAccountDecisionValues = InferType<typeof accountDecisionSchema>;

export interface FormKycAccountDecisionProps {
  /** Registra a decisão; true limpa o formulário. */
  onSubmit: (values: KycAccountDecisionValues) => Promise<boolean>;
  isSubmitting?: boolean;
  /**
   * Decisões indisponíveis no estado atual, com o motivo (chave de tradução).
   * Ex.: aprovar com documento recusado.
   */
  blocked?: Partial<Record<KycAccountDecision, string>>;
}
