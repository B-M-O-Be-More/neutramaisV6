import type {
  KycHistory,
  KycReviewDocument,
} from "@/services/adminKycReview.service";

export interface AdminKycHistoryProps {
  history: KycHistory;
  /** Para nomear o documento de cada evento. */
  documents: KycReviewDocument[];
  /** Usuário da sessão — os eventos dele aparecem como "você". */
  currentUserId: string | null;
  isLoadingMore?: boolean;
  onLoadMore: () => void;
}
