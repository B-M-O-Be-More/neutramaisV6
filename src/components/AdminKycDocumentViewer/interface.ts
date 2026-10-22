import type { DocumentViewerState } from "@/hooks/useAdminKycReview";

export interface AdminKycDocumentViewerProps {
  /** Arquivo aberto; null fecha o visualizador. */
  viewer: DocumentViewerState | null;
  onClose: () => void;
  /** Pede uma URL nova (a assinada expira em poucos minutos). */
  onRetry: () => void;
}
