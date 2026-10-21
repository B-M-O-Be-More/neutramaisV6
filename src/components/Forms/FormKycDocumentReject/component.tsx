"use client";

import { Button, Flex, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import Select from "@/components/FormControl/Select";
import Textarea from "@/components/FormControl/Textarea";
import { documentRejectSchema } from "@/schemas/kycReview";
import { KYC_DOCUMENT_REASON_CODES } from "@/services/adminKycReview.service";

import {
  FormKycDocumentRejectProps,
  KycDocumentRejectValues,
} from "./interface";

/**
 * Recusa de um documento na revisão de KYC: motivo, detalhes (obrigatórios
 * com "Outro") e nota interna. Requisito sem arquivo só aceita "Documento
 * ausente".
 */
export function FormKycDocumentReject({
  notSubmitted,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FormKycDocumentRejectProps) {
  const { t } = useTranslation();

  // `missing_document` vale só (e sempre) para requisito sem arquivo.
  const reasons = KYC_DOCUMENT_REASON_CODES.filter((code) =>
    notSubmitted ? code === "missing_document" : code !== "missing_document",
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<KycDocumentRejectValues>({
    resolver: yupResolver(documentRejectSchema),
    mode: "onBlur",
    defaultValues: {
      ...(notSubmitted ? { reasonCode: "missing_document" as const } : {}),
      reasonDetails: "",
      reviewerNote: "",
    },
  });

  const tError = (message?: string) => (message ? t(message) : undefined);
  const reasonCode = watch("reasonCode");

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Stack asChild gap="12px">
      <form onSubmit={submit} noValidate>
        <Select
          label={t("Admin.review.form.reason")}
          required
          error={tError(errors.reasonCode?.message)}
          {...register("reasonCode")}
        >
          {!notSubmitted && (
            <option value="">{t("Admin.review.form.reasonPlaceholder")}</option>
          )}
          {reasons.map((code) => (
            <option key={code} value={code}>
              {t(`Admin.review.documentReasons.${code}`)}
            </option>
          ))}
        </Select>

        <Textarea
          label={t("Admin.review.form.reasonDetails")}
          required={reasonCode === "other"}
          maxLength={1000}
          helperText={t("Admin.review.form.reasonDetailsHelper")}
          error={tError(errors.reasonDetails?.message)}
          {...register("reasonDetails")}
        />

        <Textarea
          label={t("Admin.review.form.reviewerNote")}
          maxLength={1000}
          helperText={t("Admin.review.form.reviewerNoteHelper")}
          error={tError(errors.reviewerNote?.message)}
          {...register("reviewerNote")}
        />

        <Flex gap="8px" justify="flex-end" wrap="wrap">
          <Button
            type="button"
            variant="outline"
            h="36px"
            px="14px"
            rounded="10px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="13px"
            fontWeight={600}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("Admin.review.actions.cancel")}
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            h="36px"
            px="14px"
            rounded="10px"
            bg="#EF4444"
            color="white"
            fontSize="13px"
            fontWeight={700}
            _hover={{ bg: "#DC2626" }}
          >
            {t("Admin.review.actions.confirmReject")}
          </Button>
        </Flex>
      </form>
    </Stack>
  );
}
