"use client";

import {
  Button,
  Icon,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuCircleX } from "react-icons/lu";

import ProposalFormField, {
  PROPOSAL_INPUT_STYLES,
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import {
  PROPOSALS_DIALOG_BUTTONS,
  ProposalsDialogFooter,
} from "@/components/ProposalsDialogFrame";
import { proposalCancelSchema } from "@/schemas/proposals";
import { PROPOSAL_CANCEL_REASONS } from "@/types/proposals";

import { FormProposalCancelProps, ProposalCancelValues } from "./interface";

/**
 * Motivo do cancelamento de uma proposta direta e observações para o seller
 * (Figma 2068-34938).
 */
export function FormProposalCancel({
  isSubmitting,
  onSubmit,
  onKeep,
}: FormProposalCancelProps) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposalCancelValues>({
    resolver: yupResolver(proposalCancelSchema),
    mode: "onSubmit",
    defaultValues: { notes: "" },
  });

  const reasonError = errors.reason?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="20px">
        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <RadioGroup.Root
              name={field.name}
              value={field.value ?? null}
              onValueChange={(details) => field.onChange(details.value)}
              aria-labelledby="proposal-cancel-reason"
              aria-invalid={!!reasonError}
              aria-describedby={
                reasonError ? "proposal-cancel-reason-error" : undefined
              }
              size="sm"
            >
              <Text
                id="proposal-cancel-reason"
                color="#5A6478"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {t("Proposals.direct.cancel.reason")} *
              </Text>
              <Stack gap="8px" pt="8px">
                {PROPOSAL_CANCEL_REASONS.map((reason) => (
                  <RadioGroup.Item
                    key={reason}
                    value={reason}
                    gap="10px"
                    cursor="pointer"
                  >
                    <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                    <RadioGroup.ItemIndicator
                      boxSize="16px"
                      borderColor="#767676"
                      _checked={{ bg: "#1F5AFF", borderColor: "#1F5AFF" }}
                    />
                    <RadioGroup.ItemText
                      color="#5A6478"
                      fontSize="13px"
                      lineHeight="19.5px"
                    >
                      {t(`Proposals.direct.cancel.reasons.${reason}`)}
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                ))}
              </Stack>
              {reasonError && (
                <Text
                  id="proposal-cancel-reason-error"
                  pt="4px"
                  color="#EF4444"
                  fontSize="12px"
                  lineHeight="18px"
                >
                  {t(reasonError)}
                </Text>
              )}
            </RadioGroup.Root>
          )}
        />

        <ProposalFormField
          id="proposal-cancel-notes"
          label={t("Proposals.direct.cancel.notes")}
          error={errors.notes?.message ? t(errors.notes.message) : undefined}
        >
          <Textarea
            {...PROPOSAL_INPUT_STYLES}
            id="proposal-cancel-notes"
            minH="84.5px"
            py="13px"
            resize="vertical"
            maxLength={2000}
            placeholder={t("Proposals.direct.cancel.notesPlaceholder")}
            aria-invalid={!!errors.notes}
            aria-describedby={proposalFieldDescribedBy(
              "proposal-cancel-notes",
              { error: errors.notes?.message },
            )}
            {...register("notes")}
          />
        </ProposalFormField>
      </Stack>

      <ProposalsDialogFooter gap="12px">
        <Button
          type="button"
          {...PROPOSALS_DIALOG_BUTTONS.secondary}
          rounded="14px"
          color="#5A6478"
          disabled={isSubmitting}
          onClick={onKeep}
        >
          {t("Proposals.direct.cancel.keep")}
        </Button>
        <Button
          type="submit"
          {...PROPOSALS_DIALOG_BUTTONS.danger}
          loading={isSubmitting}
        >
          <Icon as={LuCircleX} boxSize="15px" />
          {t("Proposals.direct.cancel.confirm")}
        </Button>
      </ProposalsDialogFooter>
    </form>
  );
}
