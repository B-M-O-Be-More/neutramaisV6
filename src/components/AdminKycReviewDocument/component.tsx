"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuEye,
  LuFileText,
  LuFileX,
  LuRotateCcw,
} from "react-icons/lu";

import FormKycDocumentReject from "@/components/Forms/FormKycDocumentReject";
import { formatDateTime } from "@/functions/formatDateTime";
import type { KycReviewDocument } from "@/services/adminKycReview.service";

import { AdminKycReviewDocumentProps } from "./interface";

const REVIEW_STYLES: Record<
  KycReviewDocument["review_status"],
  { icon: IconType; fg: string; bg: string; border: string }
> = {
  pending: { icon: LuClock, fg: "#5A6478", bg: "#F4F6F9", border: "#E5E8EE" },
  approved: {
    icon: LuCircleCheck,
    fg: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
  },
  rejected: {
    icon: LuCircleX,
    fg: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

const actionButton = {
  h: "34px",
  px: "12px",
  gap: "6px",
  rounded: "10px",
  fontSize: "12.5px",
  fontWeight: 600,
} as const;

/**
 * Documento da solicitação na revisão de KYC: situação, motivo da recusa e as
 * ações (ver arquivo, aprovar, recusar, reabrir).
 */
export function AdminKycReviewDocument({
  document,
  editable,
  isBusy = false,
  disabled = false,
  onView,
  onApprove,
  onReject,
  onReopen,
}: AdminKycReviewDocumentProps) {
  const { t, i18n } = useTranslation();
  const [rejecting, setRejecting] = React.useState(false);

  const submitted = document.submission_status === "submitted";
  const status = REVIEW_STYLES[document.review_status] ?? REVIEW_STYLES.pending;
  const pending = document.review_status === "pending";

  const meta = submitted
    ? [
        document.mime_type
          ? (MIME_LABELS[document.mime_type] ?? document.mime_type)
          : null,
        t("Admin.review.document.version", {
          version: document.current_version,
        }),
        document.uploaded_at
          ? t("Admin.review.document.uploadedAt", {
              date: formatDateTime(document.uploaded_at, i18n.language),
            })
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : t("Admin.review.document.notSubmitted");

  const reject = async (
    values: Parameters<AdminKycReviewDocumentProps["onReject"]>[0],
  ) => {
    const ok = await onReject(values);
    if (ok) setRejecting(false);
    return ok;
  };

  return (
    <Stack
      gap="12px"
      p="16px"
      bg="white"
      borderWidth="1px"
      borderColor={
        document.review_status === "rejected" ? "#FECACA" : "#E5E8EE"
      }
      rounded="14px"
    >
      <Flex align="flex-start" gap="12px" wrap="wrap">
        <Flex
          boxSize="36px"
          align="center"
          justify="center"
          rounded="12px"
          bg={submitted ? "#EEF3FF" : "#F4F6F9"}
          color={submitted ? "#1F5AFF" : "#A0ABB8"}
          flexShrink={0}
        >
          <Icon as={submitted ? LuFileText : LuFileX} boxSize="15px" />
        </Flex>

        <Box flex="1" minW="160px">
          <Text color="#0F1729" fontSize="13.5px" fontWeight={700}>
            {t(`Admin.review.documentTypes.${document.document_type}`, {
              defaultValue: document.document_type,
            })}
          </Text>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {meta}
          </Text>
        </Box>

        <Flex
          align="center"
          gap="6px"
          px="10px"
          py="3px"
          rounded="10px"
          bg={status.bg}
          borderWidth="1px"
          borderColor={status.border}
          color={status.fg}
          flexShrink={0}
        >
          <Icon as={status.icon} boxSize="11px" />
          <Text fontSize="12px" fontWeight={600}>
            {t(`Admin.review.document.status.${document.review_status}`)}
          </Text>
        </Flex>
      </Flex>

      {(document.reason_code || document.reviewer_note) && (
        <Stack gap="4px" ps={{ base: 0, sm: "48px" }}>
          {document.reason_code && (
            <Text color="#991B1B" fontSize="12.5px" lineHeight="19px">
              <Text as="span" fontWeight={700}>
                {t(`Admin.review.documentReasons.${document.reason_code}`, {
                  defaultValue: document.reason_code,
                })}
              </Text>
              {document.reason_details ? ` — ${document.reason_details}` : ""}
            </Text>
          )}
          {document.reviewer_note && (
            <Text color="#5A6478" fontSize="12px" lineHeight="18px">
              {t("Admin.review.document.reviewerNote", {
                note: document.reviewer_note,
              })}
            </Text>
          )}
          {document.reviewed_at && (
            <Text color="#A0ABB8" fontSize="11px">
              {t("Admin.review.document.reviewedAt", {
                date: formatDateTime(document.reviewed_at, i18n.language),
              })}
            </Text>
          )}
        </Stack>
      )}

      {rejecting ? (
        <Box ps={{ base: 0, sm: "48px" }}>
          <FormKycDocumentReject
            notSubmitted={!submitted}
            isSubmitting={isBusy}
            onSubmit={reject}
            onCancel={() => setRejecting(false)}
          />
        </Box>
      ) : (
        <Flex gap="8px" wrap="wrap" ps={{ base: 0, sm: "48px" }}>
          {submitted && (
            <Button
              type="button"
              variant="outline"
              {...actionButton}
              bg="white"
              borderColor="#E5E8EE"
              color="#5A6478"
              onClick={onView}
            >
              <Icon as={LuEye} boxSize="13px" />
              {t("Admin.review.actions.view")}
            </Button>
          )}

          {editable && pending && submitted && (
            <Button
              type="button"
              {...actionButton}
              bg="#10B981"
              color="white"
              _hover={{ bg: "#059669" }}
              loading={isBusy}
              disabled={disabled}
              onClick={() => void onApprove()}
            >
              <Icon as={LuCircleCheck} boxSize="13px" />
              {t("Admin.review.actions.approve")}
            </Button>
          )}

          {editable && pending && (
            <Button
              type="button"
              variant="outline"
              {...actionButton}
              bg="white"
              borderColor="#FECACA"
              color="#EF4444"
              disabled={disabled}
              onClick={() => setRejecting(true)}
            >
              <Icon as={LuCircleX} boxSize="13px" />
              {t("Admin.review.actions.reject")}
            </Button>
          )}

          {editable && !pending && (
            <Button
              type="button"
              variant="outline"
              {...actionButton}
              bg="white"
              borderColor="#E5E8EE"
              color="#5A6478"
              loading={isBusy}
              disabled={disabled}
              onClick={() => void onReopen()}
            >
              <Icon as={LuRotateCcw} boxSize="13px" />
              {t("Admin.review.actions.reopen")}
            </Button>
          )}
        </Flex>
      )}
    </Stack>
  );
}
