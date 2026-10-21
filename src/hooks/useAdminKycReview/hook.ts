"use client";

import React from "react";

import {
  adminKycReviewService,
  type KycAccountDecisionBody,
  type KycAccountDecisionResult,
  type KycDocumentDecisionBody,
  type KycReviewRequest,
} from "@/services/adminKycReview.service";
import {
  ApiError,
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  upstreamErrorCode,
} from "@/services/errors";

import type {
  AccountDecisionInput,
  AdminKycReviewBusy,
  DocumentDecisionInput,
  DocumentViewerState,
  PendingAccountDecision,
  UseAdminKycReviewOptions,
  UseAdminKycReviewReturn,
} from "./interface";

export const ADMIN_KYC_HISTORY_PAGE_SIZE = 50;

const STALE_SNAPSHOT = "kyc_decision_snapshot_stale";

// Códigos da compliance-api com mensagem própria em Admin.review.errors.*.
const KNOWN_ERROR_CODES = new Set([
  "invalid_token",
  "mfa_required",
  "insufficient_permission",
  "auth_unavailable",
  "not_found",
  "validation_error",
  "version_conflict",
  "invalid_request_state",
  "review_assigned_to_other",
  "document_version_conflict",
  "document_already_decided",
  "document_not_decided",
  "document_not_submitted",
  "reason_incompatible_with_submission",
  "document_has_no_file",
  "document_file_missing",
  "document_storage_reference_invalid",
  "idempotency_conflict",
  "requested_level_not_supported",
  "documents_not_reviewed",
  "rejected_documents",
  "documents_not_submitted",
  "automatic_checks_not_passed",
  "rejected_document_required",
  "identity_request_rejected",
  "identity_unavailable",
  "identity_not_configured",
  "submission_identity_conflict",
  "submission_requirements_missing",
  "artifact_identity_conflict",
  "stale_document_version",
  "request_identity_changed",
  "decision_not_invalidated",
  "special_review_required",
  "review_already_refreshed",
  "audit_unavailable",
  "storage_unavailable",
  "database_unavailable",
]);

/** Erro da camada de rede → chave de tradução (SDD §12.4). */
export function toReviewError(error: unknown): string {
  const code = upstreamErrorCode(error);
  if (code && KNOWN_ERROR_CODES.has(code)) return `Admin.review.errors.${code}`;
  if (error instanceof AuthError) return "Admin.review.errors.invalid_token";
  if (error instanceof ForbiddenError)
    return "Admin.review.errors.insufficient_permission";
  if (error instanceof NotFoundError) return "Admin.review.errors.not_found";
  if (error instanceof ValidationError)
    return "Admin.review.errors.validation_error";
  return "Admin.review.errors.failed";
}

/* ---------------------------------------------------------------------------
 * Decisão pendente da conta, guardada por solicitação no localStorage. Sem ela
 * não há como repetir a mesma chave e o mesmo corpo depois de recarregar a
 * página — e uma chave nova não reaplica a decisão já gravada.
 * ------------------------------------------------------------------------- */

const PENDING_DECISION_PREFIX = "neutramais:kyc-decision:";

function readPending(requestId: string): PendingAccountDecision | null {
  try {
    const raw = window.localStorage.getItem(
      PENDING_DECISION_PREFIX + requestId,
    );
    return raw ? (JSON.parse(raw) as PendingAccountDecision) : null;
  } catch {
    return null;
  }
}

function writePending(requestId: string, pending: PendingAccountDecision) {
  try {
    window.localStorage.setItem(
      PENDING_DECISION_PREFIX + requestId,
      JSON.stringify(pending),
    );
  } catch {
    // Sem storage a nova tentativa só funciona nesta página.
  }
}

function clearPending(requestId: string) {
  try {
    window.localStorage.removeItem(PENDING_DECISION_PREFIX + requestId);
  } catch {
    // Ignorado: nada a limpar.
  }
}

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

// Texto opcional: vazio não vai para a API (o upstream recusa campos fora de
// contexto, como motivo na aprovação).
function optional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toAccountBody(
  input: AccountDecisionInput,
  expectedVersion: number,
): KycAccountDecisionBody {
  const reject = input.decision === "reject";
  return {
    decision: input.decision,
    expected_version: expectedVersion,
    ...(reject && input.reasonCode ? { reason_code: input.reasonCode } : {}),
    ...(reject && input.reasonCode === "other"
      ? { reason_details: optional(input.reasonDetails) }
      : {}),
    ...(input.decision === "request_correction"
      ? { user_instructions: optional(input.userInstructions) }
      : {}),
    ...(optional(input.reviewerNote)
      ? { reviewer_note: optional(input.reviewerNote) }
      : {}),
  };
}

/**
 * Revisão de uma solicitação de KYC na compliance-api, a partir do
 * `organization_id` da fila:
 *
 * 1. abre/sincroniza a solicitação (`request_id` + `version`);
 * 2. inicia a revisão, decide cada documento e decide a conta, sempre com o
 *    `version` da última resposta em `expected_version`;
 * 3. trata a aplicação da decisão: `failed` → mesma chave e mesmo corpo;
 *    `kyc_decision_snapshot_stale` → `refresh-review` e decisão nova.
 *
 * Em conflito (409) o detalhe é relido, para a tela refletir o estado atual.
 */
export function useAdminKycReview({
  organizationId,
  userId,
  autoStart = false,
  onAutoStartHandled,
}: UseAdminKycReviewOptions): UseAdminKycReviewReturn {
  const [openAttempt, setOpenAttempt] = React.useState(0);
  const [request, setRequest] = React.useState<KycReviewRequest | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<AdminKycReviewBusy>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [decision, setDecision] =
    React.useState<KycAccountDecisionResult | null>(null);
  const [pending, setPending] = React.useState<PendingAccountDecision | null>(
    null,
  );
  const [viewer, setViewer] = React.useState<DocumentViewerState | null>(null);

  // Sempre a última versão conhecida — as ações não podem usar um `version`
  // capturado num render anterior.
  const requestRef = React.useRef<KycReviewRequest | null>(null);
  React.useEffect(() => {
    requestRef.current = request;
  }, [request]);
  const viewerTicket = React.useRef(0);
  const autoStartHandled = React.useRef(false);

  const latestDecisionId = request?.latest_decision_id ?? null;

  // 1. Abre (ou sincroniza) a solicitação da organização.
  // Junto vem a decisão pendente guardada para esta solicitação, se houver.
  React.useEffect(() => {
    let cancelled = false;

    adminKycReviewService
      .openRequest(organizationId)
      .then((opened) => {
        if (cancelled) return;
        setRequest(opened);
        setPending(readPending(opened.request_id));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(toReviewError(error));
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, openAttempt]);

  // Última decisão da conta: o detalhe só traz o id e o `activation_status`;
  // o `application_error` (ex.: snapshot desatualizado) vem da decisão.
  React.useEffect(() => {
    if (!latestDecisionId) return;
    let cancelled = false;
    adminKycReviewService
      .getDecision(latestDecisionId)
      .then((result) => {
        if (!cancelled) setDecision(result);
      })
      .catch(() => {
        // Sem a decisão, a tela segue com o `activation_status` do detalhe.
      });
    return () => {
      cancelled = true;
    };
  }, [latestDecisionId]);

  /** Relê o detalhe sem efeito colateral. */
  const syncDetail = React.useCallback(async () => {
    const current = requestRef.current;
    if (!current) return;
    try {
      setRequest(await adminKycReviewService.getRequest(current.request_id));
    } catch {
      // Mantém o último estado; o erro da ação já está na tela.
    }
  }, []);

  /** Executa uma mutação que devolve o detalhe atualizado. */
  const run = React.useCallback(
    async (
      label: string,
      mutate: (current: KycReviewRequest) => Promise<KycReviewRequest>,
    ) => {
      const current = requestRef.current;
      if (!current) return false;

      setBusy(label);
      setActionError(null);
      try {
        setRequest(await mutate(current));
        return true;
      } catch (error) {
        setActionError(toReviewError(error));
        if (error instanceof ConflictError) await syncDetail();
        return false;
      } finally {
        setBusy(null);
      }
    },
    [syncDetail],
  );

  const startReview = React.useCallback(
    () =>
      run("start", (current) =>
        adminKycReviewService.startReview(current.request_id, current.version),
      ),
    [run],
  );

  // Abrir com `autoStart` (botão "Iniciar Revisão" da fila) inicia a revisão
  // uma vez, só se ela ainda não começou.
  React.useEffect(() => {
    if (!request || autoStartHandled.current) return;
    autoStartHandled.current = true;
    if (autoStart && request.status === "submitted") void startReview();
    onAutoStartHandled?.();
  }, [autoStart, onAutoStartHandled, request, startReview]);

  const decideDocument = React.useCallback(
    (documentId: string, input: DocumentDecisionInput) =>
      run(`document:${documentId}`, (current) => {
        const document = current.documents.find(
          (item) => item.id === documentId,
        );
        const reject = input.decision === "reject";
        const body: KycDocumentDecisionBody = {
          decision: input.decision,
          document_version: document?.current_version ?? 0,
          expected_version: current.version,
          ...(reject && input.reasonCode
            ? { reason_code: input.reasonCode }
            : {}),
          ...(reject && optional(input.reasonDetails)
            ? { reason_details: optional(input.reasonDetails) }
            : {}),
          ...(optional(input.reviewerNote)
            ? { reviewer_note: optional(input.reviewerNote) }
            : {}),
        };
        return adminKycReviewService.decideDocument(
          current.request_id,
          documentId,
          body,
        );
      }),
    [run],
  );

  const reopenDocument = React.useCallback(
    (documentId: string) =>
      run(`document:${documentId}`, (current) =>
        adminKycReviewService.reopenDocument(
          current.request_id,
          documentId,
          current.version,
        ),
      ),
    [run],
  );

  /** Envia (ou reenvia) uma decisão da conta com a chave guardada. */
  const submitDecision = React.useCallback(
    async (current: KycReviewRequest, attempt: PendingAccountDecision) => {
      setBusy("decision");
      setActionError(null);
      try {
        const result = await adminKycReviewService.decideAccount(
          current.request_id,
          attempt.body,
          attempt.key,
        );
        setDecision(result);
        // Aplicada, não há o que repetir. Snapshot desatualizado também não:
        // a mesma chave devolveria a decisão invalidada — o caminho é o
        // refresh-review e uma decisão nova.
        if (
          result.activation_status === "applied" ||
          result.application_error === STALE_SNAPSHOT
        ) {
          clearPending(current.request_id);
          setPending(null);
        }
        await syncDetail();
        return true;
      } catch (error) {
        setActionError(toReviewError(error));
        // 4xx: esta chamada não gravou decisão, a chave não serve mais. Rede
        // ou 5xx: a decisão pode ter sido gravada — mantém para repetir.
        if (error instanceof ApiError && error.status < 500) {
          clearPending(current.request_id);
          setPending(null);
        }
        if (error instanceof ConflictError) await syncDetail();
        return false;
      } finally {
        setBusy(null);
      }
    },
    [syncDetail],
  );

  const decideAccount = React.useCallback(
    async (input: AccountDecisionInput) => {
      const current = requestRef.current;
      if (!current) return false;

      // A chave é gravada antes do envio: se a resposta se perder, a nova
      // tentativa repete a mesma chave e recebe a mesma decisão.
      const attempt: PendingAccountDecision = {
        key: newIdempotencyKey(),
        body: toAccountBody(input, current.version),
        actorId: userId,
      };
      writePending(current.request_id, attempt);
      setPending(attempt);
      return submitDecision(current, attempt);
    },
    [submitDecision, userId],
  );

  // Só quem decidiu pode repetir: o Identity confere o autor da decisão.
  const ownPending =
    pending && (!pending.actorId || pending.actorId === userId)
      ? pending
      : null;

  const retryDecision = React.useCallback(async () => {
    const current = requestRef.current;
    if (!current || !ownPending) return false;
    return submitDecision(current, ownPending);
  }, [ownPending, submitDecision]);

  const refreshReview = React.useCallback(async () => {
    const ok = await run("refresh", (current) =>
      adminKycReviewService.refreshReview(current.request_id),
    );
    if (ok) {
      // A decisão invalidada fica no histórico; a próxima precisa de chave nova.
      const current = requestRef.current;
      if (current) clearPending(current.request_id);
      setPending(null);
      setDecision(null);
    }
    return ok;
  }, [run]);

  const openDocument = React.useCallback((documentId: string) => {
    const current = requestRef.current;
    const document = current?.documents.find((item) => item.id === documentId);
    if (!current || !document) return;

    const ticket = ++viewerTicket.current;
    setViewer({ document, url: null, expiresAt: null, error: null });

    adminKycReviewService
      .getDocumentUrl(current.request_id, documentId, "view")
      .then((access) => {
        if (viewerTicket.current !== ticket) return;
        setViewer({
          document,
          url: access.url,
          expiresAt: access.expires_at,
          error: null,
        });
      })
      .catch((error) => {
        if (viewerTicket.current !== ticket) return;
        setViewer({
          document,
          url: null,
          expiresAt: null,
          error: toReviewError(error),
        });
      });
  }, []);

  const closeDocument = React.useCallback(() => {
    viewerTicket.current += 1;
    setViewer(null);
  }, []);

  const loadMoreHistory = React.useCallback(() => {
    const current = requestRef.current;
    if (!current || busy) return;
    const loaded = current.history.items.length;
    if (loaded >= current.history.total) return;

    setBusy("history");
    adminKycReviewService
      .getRequest(current.request_id, {
        history_limit: ADMIN_KYC_HISTORY_PAGE_SIZE,
        history_offset: loaded,
      })
      .then((page) =>
        setRequest((latest) =>
          latest && latest.request_id === page.request_id
            ? {
                ...latest,
                history: {
                  ...page.history,
                  items: [...latest.history.items, ...page.history.items],
                },
              }
            : latest,
        ),
      )
      .catch((error) => setActionError(toReviewError(error)))
      .finally(() => setBusy(null));
  }, [busy]);

  const reload = React.useCallback(() => {
    setActionError(null);
    if (requestRef.current) {
      void syncDetail();
    } else {
      setLoadError(null);
      setOpenAttempt((n) => n + 1);
    }
  }, [syncDetail]);

  const clearActionError = React.useCallback(() => setActionError(null), []);

  const isReviewer =
    !!request &&
    request.status === "in_review" &&
    !!userId &&
    request.reviewer_id === userId;

  // Há o que repetir enquanto a decisão não foi aplicada nem invalidada.
  const canRetryDecision =
    !!ownPending &&
    decision?.activation_status !== "applied" &&
    decision?.application_error !== STALE_SNAPSHOT;

  return {
    request,
    isLoading: !request && !loadError,
    loadError,
    busy,
    actionError,
    clearActionError,
    isReviewer,
    decision,
    canRetryDecision,
    viewer,
    reload,
    startReview,
    decideDocument,
    reopenDocument,
    decideAccount,
    retryDecision,
    refreshReview,
    openDocument,
    closeDocument,
    loadMoreHistory,
  };
}
