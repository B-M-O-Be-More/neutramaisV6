"use client";

import {
  Box,
  Button,
  CloseButton,
  Flex,
  Grid,
  Icon,
  Link,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowLeft,
  LuBan,
  LuCircleAlert,
  LuCircleCheck,
  LuCirclePlay,
  LuCircleX,
  LuClock,
  LuFileSearch,
  LuFileWarning,
  LuRefreshCw,
  LuRotateCcw,
  LuTriangleAlert,
  LuUsers,
} from "react-icons/lu";

import AdminKycChecks from "@/components/AdminKycChecks";
import AdminKycDocumentViewer from "@/components/AdminKycDocumentViewer";
import AdminKycHistory from "@/components/AdminKycHistory";
import AdminKycReviewDocument from "@/components/AdminKycReviewDocument";
import FormKycAccountDecision, {
  type KycAccountDecisionValues,
} from "@/components/Forms/FormKycAccountDecision";
import { useSession } from "@/contexts/SessionContext";
import { formatDateTime } from "@/functions/formatDateTime";
import { formatTaxId } from "@/functions/formatTaxId";
import { useAdminKycReview } from "@/hooks/useAdminKycReview";
import type {
  KycAccountDecision,
  KycAccountReasonCode,
  KycDocumentReasonCode,
  KycReviewRequest,
  KycReviewStatus,
} from "@/services/adminKycReview.service";

import { AdminKycReviewProps } from "./interface";

const AMBER = {
  fg: "#D97706",
  bg: "#FFFBEB",
  border: "#FDE68A",
  text: "#92400E",
};
const RED = {
  fg: "#EF4444",
  bg: "#FEF2F2",
  border: "#FECACA",
  text: "#991B1B",
};
const GREEN = {
  fg: "#10B981",
  bg: "#EDFBF5",
  border: "#AAECD5",
  text: "#065F46",
};
const BLUE = {
  fg: "#1F5AFF",
  bg: "#EEF3FF",
  border: "#C7D8FF",
  text: "#1E3A8A",
};
const GRAY = {
  fg: "#5A6478",
  bg: "#F4F6F9",
  border: "#E5E8EE",
  text: "#334155",
};

type Tone = typeof AMBER;

const TYPE_COLORS = {
  seller: { fg: "#8B5CF6", bg: "#F3EEFF", border: "#D3BFFD" },
  buyer: { fg: "#1F5AFF", bg: "#EEF3FF", border: "#C7D8FF" },
};

const STATUS_STYLES: Record<KycReviewStatus, { icon: IconType } & Tone> = {
  submitted: { icon: LuClock, ...AMBER },
  in_review: { icon: LuFileSearch, ...BLUE },
  correction_requested: { icon: LuFileWarning, ...AMBER },
  special_review: { icon: LuTriangleAlert, ...RED },
  approved: { icon: LuCircleCheck, ...GREEN },
  rejected: { icon: LuCircleX, ...RED },
};

const STALE_SNAPSHOT = "kyc_decision_snapshot_stale";

const card = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "14px",
} as const;

/**
 * Por que cada decisão da conta não está disponível agora, espelhando as
 * regras da compliance-api (as mesmas recusas viriam como 422).
 */
function blockedDecisions(
  request: KycReviewRequest,
): Partial<Record<KycAccountDecision, string>> {
  const { documents, automatic_checks: checks } = request;

  if (
    documents.length === 0 ||
    documents.some((item) => item.review_status === "pending")
  ) {
    const reason = "Admin.review.blocked.pendingDocuments";
    return { approve: reason, request_correction: reason, reject: reason };
  }

  const hasRejected = documents.some(
    (item) => item.review_status === "rejected",
  );
  const missing = documents.some(
    (item) => item.submission_status === "not_submitted",
  );
  const checksBlock = checks.some(
    (check) =>
      check.status === "failed" ||
      (check.policy !== "advisory" && check.status !== "passed"),
  );

  return {
    ...(hasRejected
      ? { approve: "Admin.review.blocked.rejectedDocuments" }
      : missing
        ? { approve: "Admin.review.blocked.missingDocuments" }
        : checksBlock
          ? { approve: "Admin.review.blocked.checksNotPassed" }
          : {}),
    ...(!hasRejected
      ? { request_correction: "Admin.review.blocked.noRejectedDocument" }
      : {}),
  };
}

interface NoticeProps {
  tone: Tone;
  icon: IconType;
  children: React.ReactNode;
  action?: React.ReactNode;
  role?: "alert" | "status";
}

function Notice({
  tone,
  icon,
  children,
  action,
  role = "status",
}: NoticeProps) {
  return (
    <Flex
      align={{ base: "flex-start", md: "center" }}
      direction={{ base: "column", md: "row" }}
      gap="12px"
      px="16px"
      py="12px"
      bg={tone.bg}
      borderWidth="1px"
      borderColor={tone.border}
      rounded="14px"
      role={role}
    >
      <Flex align="flex-start" gap="10px" flex="1" minW={0}>
        <Icon
          as={icon}
          boxSize="15px"
          color={tone.fg}
          mt="2px"
          flexShrink={0}
        />
        <Text color={tone.text} fontSize="12.5px" lineHeight="19px">
          {children}
        </Text>
      </Flex>
      {action}
    </Flex>
  );
}

const noticeButton = {
  h: "34px",
  px: "12px",
  gap: "6px",
  rounded: "10px",
  fontSize: "12.5px",
  fontWeight: 700,
  flexShrink: 0,
} as const;

/**
 * Revisão de uma solicitação de KYC (compliance-api): documentos com as
 * decisões de cada um, checagens automáticas, decisão da conta e histórico.
 */
export function AdminKycReview({
  organizationId,
  autoStart = false,
  onAutoStartHandled,
}: AdminKycReviewProps) {
  const { t, i18n } = useTranslation();
  const { profile } = useSession();
  const userId = profile?.id ?? null;

  const review = useAdminKycReview({
    organizationId,
    userId,
    autoStart,
    onAutoStartHandled,
  });
  const {
    request,
    isLoading,
    loadError,
    busy,
    actionError,
    clearActionError,
    isReviewer,
    decision,
    canRetryDecision,
    viewer,
  } = review;

  const backLink = (
    <Link
      asChild
      alignSelf="flex-start"
      color="#5A6478"
      fontSize="13px"
      fontWeight={600}
    >
      <NextLink href="/admin">
        <Icon as={LuArrowLeft} boxSize="13px" />
        {t("Admin.review.back")}
      </NextLink>
    </Link>
  );

  if (isLoading || loadError || !request) {
    return (
      <Stack gap="20px">
        {backLink}
        {loadError ? (
          <Stack
            align="center"
            gap="12px"
            py="40px"
            textAlign="center"
            {...card}
          >
            <Text color="#0F1729" fontSize="14px" fontWeight={600}>
              {t(loadError)}
            </Text>
            <Button
              variant="outline"
              h="36px"
              px="14px"
              rounded="10px"
              borderColor="#E5E8EE"
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={600}
              onClick={review.reload}
            >
              {t("Admin.review.retry")}
            </Button>
          </Stack>
        ) : (
          <Flex justify="center" py="48px">
            <Spinner
              color="#1F5AFF"
              size="lg"
              aria-label={t("Admin.review.loading")}
            />
          </Flex>
        )}
      </Stack>
    );
  }

  const { organization } = request;
  const status = STATUS_STYLES[request.status] ?? STATUS_STYLES.submitted;
  const type = TYPE_COLORS[organization.organization_type] ?? TYPE_COLORS.buyer;
  const isBusy = !!busy;

  // A decisão só descreve a situação atual se o status ainda for o dela
  // (depois de um refresh-review a solicitação volta para `submitted`).
  const currentDecision =
    decision && decision.status === request.status ? decision : null;
  const activation = currentDecision?.activation_status ?? null;
  const applicationError = currentDecision?.application_error ?? null;

  const submitDecision = (values: KycAccountDecisionValues) =>
    review.decideAccount({
      decision: values.decision as KycAccountDecision,
      reasonCode: (values.reasonCode ?? "") as KycAccountReasonCode | "",
      reasonDetails: values.reasonDetails,
      userInstructions: values.userInstructions,
      reviewerNote: values.reviewerNote,
    });

  const reviewerLabel = !request.reviewer_id
    ? null
    : request.reviewer_id === userId
      ? t("Admin.review.header.reviewerYou")
      : t("Admin.review.header.reviewerOther", {
          id: request.reviewer_id.slice(0, 8),
        });

  return (
    <Stack gap="20px">
      {backLink}

      {/* Cabeçalho: organização e situação da solicitação. */}
      <Flex
        {...card}
        p="20px"
        gap="16px"
        align="flex-start"
        wrap={{ base: "wrap", md: "nowrap" }}
      >
        <Flex
          boxSize="44px"
          align="center"
          justify="center"
          rounded="14px"
          bg={type.bg}
          borderWidth="1px"
          borderColor={type.border}
          flexShrink={0}
        >
          <Icon as={LuUsers} boxSize="18px" color={type.fg} />
        </Flex>

        <Stack gap="2px" flex="1" minW={0}>
          <Flex align="center" gap="8px" wrap="wrap">
            <Text
              as="h1"
              color="#0F1729"
              fontSize="18px"
              fontWeight={800}
              lineHeight="26px"
            >
              {organization.legal_name}
            </Text>
            <Text
              as="span"
              px="8px"
              py="2px"
              rounded="8px"
              bg={type.bg}
              color={type.fg}
              fontSize="10px"
              fontWeight={700}
              textTransform="uppercase"
            >
              {t(`Admin.organization.types.${organization.organization_type}`)}
            </Text>
          </Flex>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {formatTaxId(
              organization.tax_id,
              organization.tax_id_country === "BR" ? "CNPJ" : undefined,
            )}{" "}
            · {request.display_id} ·{" "}
            {t("Admin.organization.submittedAt", {
              date: formatDateTime(request.submitted_at, i18n.language),
            })}
          </Text>
          <Text color="#A0ABB8" fontSize="11.5px" lineHeight="17px">
            {t("Admin.review.header.level", {
              level: t(`Admin.organization.levels.${request.requested_level}`, {
                defaultValue: request.requested_level,
              }),
            })}
            {" · "}
            {t("Admin.review.header.corrections", {
              count: request.correction_attempt_count ?? 0,
            })}
            {reviewerLabel ? ` · ${reviewerLabel}` : ""}
          </Text>
        </Stack>

        <Flex
          align="center"
          gap="6px"
          px="12px"
          py="4px"
          rounded="10px"
          bg={status.bg}
          borderWidth="1px"
          borderColor={status.border}
          color={status.fg}
          flexShrink={0}
        >
          <Icon as={status.icon} boxSize="12px" />
          <Text fontSize="12px" fontWeight={600}>
            {t(`Admin.review.status.${request.status}`)}
          </Text>
        </Flex>
      </Flex>

      {actionError && (
        <Notice
          tone={RED}
          icon={LuCircleAlert}
          role="alert"
          action={
            <CloseButton
              size="xs"
              aria-label={t("Admin.review.actions.dismiss")}
              onClick={clearActionError}
            />
          }
        >
          {t(actionError)}
        </Notice>
      )}

      {/* Próximo passo da solicitação. */}
      {request.status === "submitted" && (
        <Notice
          tone={AMBER}
          icon={LuClock}
          action={
            <Button
              {...noticeButton}
              bg="#1F5AFF"
              color="white"
              _hover={{ bg: "#1A4FE0" }}
              loading={busy === "start"}
              disabled={isBusy}
              onClick={() => void review.startReview()}
            >
              <Icon as={LuCirclePlay} boxSize="13px" />
              {t("Admin.organization.actions.startReview")}
            </Button>
          }
        >
          {t("Admin.review.notices.submitted")}
        </Notice>
      )}

      {request.status === "in_review" && !isReviewer && (
        <Notice tone={GRAY} icon={LuFileSearch}>
          {t("Admin.review.notices.assignedToOther")}
        </Notice>
      )}

      {request.status === "in_review" && isReviewer && canRetryDecision && (
        <Notice
          tone={AMBER}
          icon={LuTriangleAlert}
          action={
            <Button
              {...noticeButton}
              bg="#D97706"
              color="white"
              loading={busy === "decision"}
              disabled={isBusy}
              onClick={() => void review.retryDecision()}
            >
              <Icon as={LuRotateCcw} boxSize="13px" />
              {t("Admin.review.actions.resendDecision")}
            </Button>
          }
        >
          {t("Admin.review.notices.unconfirmedDecision")}
        </Notice>
      )}

      {request.status === "special_review" && (
        <Notice tone={RED} icon={LuBan}>
          {t("Admin.review.notices.specialReview")}
        </Notice>
      )}

      {/* Aplicação da decisão na conta (Identity). */}
      {activation === "applied" && (
        <Notice tone={GREEN} icon={LuCircleCheck}>
          {t("Admin.review.notices.applied", {
            decision: t(
              `Admin.review.decisions.${currentDecision?.decision}.label`,
            ),
          })}
        </Notice>
      )}

      {activation === "pending" && (
        <Notice
          tone={GRAY}
          icon={LuClock}
          action={
            <Button
              {...noticeButton}
              variant="outline"
              bg="white"
              borderColor="#E5E8EE"
              color="#5A6478"
              disabled={isBusy}
              onClick={review.reload}
            >
              <Icon as={LuRefreshCw} boxSize="13px" />
              {t("Admin.review.actions.reload")}
            </Button>
          }
        >
          {t("Admin.review.notices.applying")}
        </Notice>
      )}

      {activation === "failed" && applicationError === STALE_SNAPSHOT && (
        <Notice
          tone={AMBER}
          icon={LuTriangleAlert}
          action={
            <Button
              {...noticeButton}
              bg="#D97706"
              color="white"
              loading={busy === "refresh"}
              disabled={isBusy}
              onClick={() => void review.refreshReview()}
            >
              <Icon as={LuRefreshCw} boxSize="13px" />
              {t("Admin.review.actions.refreshReview")}
            </Button>
          }
        >
          {t("Admin.review.notices.stale")}
        </Notice>
      )}

      {activation === "failed" && applicationError !== STALE_SNAPSHOT && (
        <Notice
          tone={RED}
          icon={LuCircleAlert}
          action={
            canRetryDecision ? (
              <Button
                {...noticeButton}
                bg="#EF4444"
                color="white"
                loading={busy === "decision"}
                disabled={isBusy}
                onClick={() => void review.retryDecision()}
              >
                <Icon as={LuRotateCcw} boxSize="13px" />
                {t("Admin.review.actions.retryApply")}
              </Button>
            ) : undefined
          }
        >
          {t("Admin.review.notices.applyFailed", {
            error: t(`Admin.review.errors.${applicationError}`, {
              defaultValue: applicationError ?? "",
            }),
          })}{" "}
          {!canRetryDecision && t("Admin.review.notices.retryElsewhere")}
        </Notice>
      )}

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 3fr) minmax(0, 2fr)" }}
        gap="20px"
        alignItems="start"
      >
        <Stack gap="12px">
          <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
            {t("Admin.review.sections.documents")}
          </Text>
          {request.documents.length === 0 ? (
            <Text {...card} p="20px" color="#8A9AB5" fontSize="13px">
              {t("Admin.review.document.empty")}
            </Text>
          ) : (
            request.documents.map((document) => (
              <AdminKycReviewDocument
                key={document.id}
                document={document}
                editable={isReviewer}
                isBusy={busy === `document:${document.id}`}
                disabled={isBusy}
                onView={() => review.openDocument(document.id)}
                onApprove={() =>
                  review.decideDocument(document.id, { decision: "approve" })
                }
                onReject={(values) =>
                  review.decideDocument(document.id, {
                    decision: "reject",
                    reasonCode: values.reasonCode as KycDocumentReasonCode,
                    reasonDetails: values.reasonDetails,
                    reviewerNote: values.reviewerNote,
                  })
                }
                onReopen={() => review.reopenDocument(document.id)}
              />
            ))
          )}
        </Stack>

        <Stack gap="20px">
          <Stack gap="12px">
            <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
              {t("Admin.review.sections.checks")}
            </Text>
            <AdminKycChecks checks={request.automatic_checks} />
          </Stack>

          {isReviewer && (
            <Stack gap="12px" {...card} p="20px">
              <Stack gap="2px">
                <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
                  {t("Admin.review.sections.decision")}
                </Text>
                <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                  {t("Admin.review.decisionHint")}
                </Text>
              </Stack>
              <FormKycAccountDecision
                onSubmit={submitDecision}
                isSubmitting={busy === "decision"}
                blocked={blockedDecisions(request)}
              />
            </Stack>
          )}
        </Stack>
      </Grid>

      <Stack gap="12px" {...card} p="20px">
        <Text as="h2" color="#0F1729" fontSize="15px" fontWeight={700}>
          {t("Admin.review.sections.history")}
        </Text>
        <Box>
          <AdminKycHistory
            history={request.history}
            documents={request.documents}
            currentUserId={userId}
            isLoadingMore={busy === "history"}
            onLoadMore={review.loadMoreHistory}
          />
        </Box>
      </Stack>

      <AdminKycDocumentViewer
        viewer={viewer}
        onClose={review.closeDocument}
        onRetry={() => viewer && review.openDocument(viewer.document.id)}
      />
    </Stack>
  );
}
