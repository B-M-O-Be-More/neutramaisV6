import type { SanctionsScreeningResult } from "@/services/admin.service";
import type {
  KycAccountDecision,
  KycAccountDecisionBody,
  KycAccountDecisionResult,
  KycAccountReasonCode,
  KycDocumentDecision,
  KycDocumentReasonCode,
  KycReviewDocument,
  KycReviewRequest,
} from "@/services/adminKycReview.service";

export type {
  KycAccountDecisionResult,
  KycReviewDocument,
  KycReviewRequest,
  SanctionsScreeningResult,
};

export interface UseAdminKycReviewOptions {
  /** `organization_id` da linha escolhida na fila. */
  organizationId: string;
  /** `id` do usuário da sessão — identifica a revisão como sua. */
  userId: string | null;
  /** Inicia a revisão assim que a solicitação abrir, se ainda estiver `submitted`. */
  autoStart?: boolean;
  /** Chamado uma vez, depois de tratar o `autoStart`. */
  onAutoStartHandled?: () => void;
}

export interface DocumentDecisionInput {
  decision: KycDocumentDecision;
  reasonCode?: KycDocumentReasonCode | "";
  reasonDetails?: string;
  reviewerNote?: string;
}

export interface AccountDecisionInput {
  decision: KycAccountDecision;
  reasonCode?: KycAccountReasonCode | "";
  reasonDetails?: string;
  userInstructions?: string;
  reviewerNote?: string;
}

/**
 * Decisão enviada e ainda não aplicada na conta. Guarda a chave e o corpo
 * originais: a nova tentativa precisa repetir os dois, pelo mesmo autor.
 */
export interface PendingAccountDecision {
  key: string;
  body: KycAccountDecisionBody;
  actorId: string | null;
}

/** Arquivo aberto no visualizador. */
export interface DocumentViewerState {
  document: KycReviewDocument;
  /** URL assinada; null enquanto carrega ou se falhou. */
  url: string | null;
  expiresAt: string | null;
  /** Chave de tradução do erro, quando a URL não pôde ser emitida. */
  error: string | null;
}

/**
 * Ação em andamento: `open`, `start`, `refresh`, `decision`, `history`,
 * `sanctions` ou `document:{id}`. null quando nada está em voo.
 */
export type AdminKycReviewBusy = string | null;

export interface UseAdminKycReviewReturn {
  request: KycReviewRequest | null;
  isLoading: boolean;
  /** Chave de tradução do erro ao abrir a solicitação. */
  loadError: string | null;
  busy: AdminKycReviewBusy;
  /** Chave de tradução do erro da última ação. */
  actionError: string | null;
  clearActionError: () => void;
  /** A revisão está `in_review` e atribuída ao usuário da sessão. */
  isReviewer: boolean;
  /** Última decisão da conta (resposta ou leitura de `latest_decision_id`). */
  decision: KycAccountDecisionResult | null;
  /** Há uma decisão não aplicada que pode ser reenviada com a mesma chave. */
  canRetryDecision: boolean;
  /** Última checagem de sanções rodada nesta tela (Identity). */
  sanctionsRun: SanctionsScreeningResult | null;
  viewer: DocumentViewerState | null;

  /** Relê o detalhe (ou reabre, se a primeira abertura falhou). */
  reload: () => void;
  startReview: () => Promise<boolean>;
  decideDocument: (
    documentId: string,
    input: DocumentDecisionInput,
  ) => Promise<boolean>;
  reopenDocument: (documentId: string) => Promise<boolean>;
  decideAccount: (input: AccountDecisionInput) => Promise<boolean>;
  /** Reenvia a decisão pendente com a mesma chave e o mesmo corpo. */
  retryDecision: () => Promise<boolean>;
  /** Depois de `kyc_decision_snapshot_stale`: volta para `submitted`. */
  refreshReview: () => Promise<boolean>;
  /**
   * Roda a checagem de sanções no Identity e sincroniza a solicitação, para as
   * checagens automáticas refletirem o resultado.
   */
  runSanctions: () => Promise<boolean>;
  openDocument: (documentId: string) => void;
  closeDocument: () => void;
  loadMoreHistory: () => void;
}
