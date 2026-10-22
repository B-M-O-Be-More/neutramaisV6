"use client";

import { Box, Button, chakra, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleCheck,
  LuCircleX,
  LuFileWarning,
  LuTriangleAlert,
} from "react-icons/lu";

import Select from "@/components/FormControl/Select";
import Textarea from "@/components/FormControl/Textarea";
import { accountDecisionSchema } from "@/schemas/kycReview";
import {
  KYC_ACCOUNT_DECISIONS,
  KYC_ACCOUNT_REASON_CODES,
  type KycAccountDecision,
} from "@/services/adminKycReview.service";

import {
  FormKycAccountDecisionProps,
  KycAccountDecisionValues,
} from "./interface";

const DECISION_STYLES: Record<
  KycAccountDecision,
  { icon: IconType; fg: string; bg: string; border: string; solid: string }
> = {
  approve: {
    icon: LuCircleCheck,
    fg: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
    solid: "#10B981",
  },
  request_correction: {
    icon: LuFileWarning,
    fg: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    solid: "#D97706",
  },
  reject: {
    icon: LuCircleX,
    fg: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    solid: "#EF4444",
  },
};

// Sem `decision`: nenhuma opção marcada até o revisor escolher.
const EMPTY: DefaultValues<KycAccountDecisionValues> = {
  reasonCode: "",
  reasonDetails: "",
  userInstructions: "",
  reviewerNote: "",
};

/**
 * Decisão da conta na revisão de KYC. A decisão é definitiva, então o envio
 * passa por uma confirmação (RNF-004).
 */
export function FormKycAccountDecision({
  onSubmit,
  isSubmitting = false,
  blocked = {},
}: FormKycAccountDecisionProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] =
    React.useState<KycAccountDecisionValues | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<KycAccountDecisionValues>({
    resolver: yupResolver(accountDecisionSchema),
    mode: "onBlur",
    defaultValues: EMPTY,
  });

  const tError = (message?: string) => (message ? t(message) : undefined);
  const decision = watch("decision") as KycAccountDecision | "";
  const reasonCode = watch("reasonCode");

  // Primeiro passo: valida e pede confirmação.
  const review = handleSubmit((values) => setConfirming(values));

  const confirm = async () => {
    if (!confirming) return;
    const ok = await onSubmit(confirming);
    setConfirming(null);
    if (ok) reset(EMPTY);
  };

  return (
    <Stack asChild gap="14px">
      <form onSubmit={review} noValidate>
        <chakra.fieldset
          display="flex"
          flexDirection="column"
          gap="8px"
          border="none"
          p={0}
          m={0}
          minW={0}
          disabled={!!confirming}
        >
          <Text
            as="legend"
            color="#0F1729"
            fontSize="13px"
            fontWeight={600}
            mb="8px"
          >
            {t("Admin.review.form.decision")}
          </Text>
          {KYC_ACCOUNT_DECISIONS.map((option) => {
            const style = DECISION_STYLES[option];
            const reason = blocked[option];
            const selected = decision === option;
            return (
              <chakra.label
                key={option}
                display="flex"
                alignItems="flex-start"
                gap="10px"
                px="14px"
                py="10px"
                rounded="12px"
                borderWidth="1px"
                borderColor={selected ? style.border : "#E5E8EE"}
                bg={selected ? style.bg : "white"}
                cursor={reason ? "not-allowed" : "pointer"}
                opacity={reason ? 0.6 : 1}
              >
                <chakra.input
                  type="radio"
                  value={option}
                  disabled={!!reason}
                  mt="3px"
                  css={{ accentColor: style.solid }}
                  {...register("decision")}
                />
                <Box minW={0}>
                  <Flex align="center" gap="6px" color={style.fg}>
                    <Icon as={style.icon} boxSize="13px" />
                    <Text fontSize="13px" fontWeight={700}>
                      {t(`Admin.review.decisions.${option}.label`)}
                    </Text>
                  </Flex>
                  <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                    {reason
                      ? t(reason)
                      : t(`Admin.review.decisions.${option}.description`)}
                  </Text>
                </Box>
              </chakra.label>
            );
          })}
          {errors.decision?.message && (
            <Text color="#EF4444" fontSize="12px" role="alert">
              {tError(errors.decision.message)}
            </Text>
          )}
        </chakra.fieldset>

        {decision === "reject" && (
          <>
            <Select
              label={t("Admin.review.form.accountReason")}
              required
              disabled={!!confirming}
              error={tError(errors.reasonCode?.message)}
              {...register("reasonCode")}
            >
              <option value="">
                {t("Admin.review.form.reasonPlaceholder")}
              </option>
              {KYC_ACCOUNT_REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`Admin.review.accountReasons.${code}`)}
                </option>
              ))}
            </Select>
            {reasonCode === "other" && (
              <Textarea
                label={t("Admin.review.form.reasonDetails")}
                required
                maxLength={1000}
                disabled={!!confirming}
                error={tError(errors.reasonDetails?.message)}
                {...register("reasonDetails")}
              />
            )}
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("Admin.review.form.accountReasonInternal")}
            </Text>
          </>
        )}

        {decision === "request_correction" && (
          <Textarea
            label={t("Admin.review.form.userInstructions")}
            required
            maxLength={2000}
            disabled={!!confirming}
            helperText={t("Admin.review.form.userInstructionsHelper")}
            error={tError(errors.userInstructions?.message)}
            {...register("userInstructions")}
          />
        )}

        {decision && (
          <Textarea
            label={t("Admin.review.form.reviewerNote")}
            maxLength={1000}
            disabled={!!confirming}
            helperText={t("Admin.review.form.reviewerNoteHelper")}
            error={tError(errors.reviewerNote?.message)}
            {...register("reviewerNote")}
          />
        )}

        {confirming ? (
          <Stack
            gap="10px"
            px="14px"
            py="12px"
            rounded="12px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            role="alertdialog"
            aria-label={t("Admin.review.form.confirmTitle")}
          >
            <Flex align="flex-start" gap="8px">
              <Icon
                as={LuTriangleAlert}
                boxSize="14px"
                color="#D97706"
                mt="2px"
                flexShrink={0}
              />
              <Text color="#92400E" fontSize="12.5px" lineHeight="19px">
                {t("Admin.review.form.confirmText", {
                  decision: t(
                    `Admin.review.decisions.${confirming.decision}.label`,
                  ),
                })}
              </Text>
            </Flex>
            <Flex gap="8px" justify="flex-end" wrap="wrap">
              <Button
                type="button"
                variant="outline"
                h="36px"
                px="14px"
                rounded="10px"
                bg="white"
                borderColor="#E5E8EE"
                color="#5A6478"
                fontSize="13px"
                fontWeight={600}
                disabled={isSubmitting}
                onClick={() => setConfirming(null)}
              >
                {t("Admin.review.actions.back")}
              </Button>
              <Button
                type="button"
                loading={isSubmitting}
                h="36px"
                px="14px"
                rounded="10px"
                bg={
                  DECISION_STYLES[confirming.decision as KycAccountDecision]
                    ?.solid ?? "#1F5AFF"
                }
                color="white"
                fontSize="13px"
                fontWeight={700}
                onClick={confirm}
              >
                {t("Admin.review.actions.confirmDecision")}
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Button
            type="submit"
            alignSelf="stretch"
            h="40px"
            rounded="12px"
            bg="#1F5AFF"
            color="white"
            fontSize="13.5px"
            fontWeight={700}
            _hover={{ bg: "brand.600" }}
          >
            {t("Admin.review.actions.submitDecision")}
          </Button>
        )}
      </form>
    </Stack>
  );
}
