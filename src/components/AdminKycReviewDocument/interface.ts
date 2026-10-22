import type { KycDocumentRejectValues } from "@/components/Forms/FormKycDocumentReject";
import type { KycReviewDocument } from "@/services/adminKycReview.service";

export interface AdminKycReviewDocumentProps {
  document: KycReviewDocument;
  /** Revisão em andamento e atribuída a quem vê: libera as decisões. */
  editable: boolean;
  /** Uma ação deste documento está em voo. */
  isBusy?: boolean;
  /** Outra ação da revisão está em voo — bloqueia os botões. */
  disabled?: boolean;
  onView: () => void;
  onApprove: () => Promise<boolean>;
  onReject: (values: KycDocumentRejectValues) => Promise<boolean>;
  onReopen: () => Promise<boolean>;
}
