"use client";

import {
  Button,
  Icon,
  Input,
  InputGroup,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";

import OfferMaskedInput, { MONEY_MASK } from "@/components/OfferMaskedInput";
import ProposalFormField, {
  PROPOSAL_INPUT_STYLES,
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import {
  PROPOSALS_DIALOG_BUTTONS,
  ProposalsDialogFooter,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import { proposalRevisionSchema } from "@/schemas/proposals";

import { FormProposalRevisionProps, ProposalRevisionValues } from "./interface";

/**
 * Novas condições de uma proposta direta (Figma 2063-32209): preço (na moeda
 * original), SLA, prazo de entrega, política de cancelamento e observações.
 */
export function FormProposalRevision({
  currency,
  nextVersion,
  defaultValues,
  onSubmit,
  onBack,
}: FormProposalRevisionProps) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProposalRevisionValues>({
    resolver: yupResolver(proposalRevisionSchema),
    mode: "onBlur",
    defaultValues,
  });

  const tError = (message?: string) => (message ? t(message) : undefined);
  const priceHelper = t("Proposals.direct.revise.priceHelper", { currency });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="20px">
        <ProposalsNotice tone="info">
          {t("Proposals.direct.revise.notice", { version: nextVersion })}
        </ProposalsNotice>

        <SimpleGrid columns={{ base: 1, sm: 2 }} columnGap="16px" rowGap="12px">
          <ProposalFormField
            id="proposal-price"
            label={t("Proposals.direct.revise.price", { currency })}
            required
            error={tError(errors.price?.message)}
            helper={priceHelper}
          >
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <OfferMaskedInput
                  {...PROPOSAL_INPUT_STYLES}
                  id="proposal-price"
                  name={field.name}
                  maskOptions={MONEY_MASK}
                  inputMode="decimal"
                  value={field.value}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  aria-invalid={!!errors.price}
                  aria-describedby={proposalFieldDescribedBy("proposal-price", {
                    error: errors.price?.message,
                    helper: priceHelper,
                  })}
                />
              )}
            />
          </ProposalFormField>

          <ProposalFormField
            id="proposal-sla"
            label={t("Proposals.direct.revise.sla")}
            required
            error={tError(errors.sla?.message)}
          >
            <Input
              {...PROPOSAL_INPUT_STYLES}
              id="proposal-sla"
              maxLength={200}
              aria-invalid={!!errors.sla}
              aria-describedby={proposalFieldDescribedBy("proposal-sla", {
                error: errors.sla?.message,
              })}
              {...register("sla")}
            />
          </ProposalFormField>

          <ProposalFormField
            id="proposal-delivery"
            label={t("Proposals.direct.revise.delivery")}
            required
            error={tError(errors.deliveryBusinessDays?.message)}
          >
            <InputGroup
              endElement={
                <Text color="#8A9AB5" fontSize="13px" pe="4px">
                  {t("Proposals.direct.revise.deliveryUnit")}
                </Text>
              }
            >
              <Input
                {...PROPOSAL_INPUT_STYLES}
                id="proposal-delivery"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                aria-invalid={!!errors.deliveryBusinessDays}
                aria-describedby={proposalFieldDescribedBy(
                  "proposal-delivery",
                  { error: errors.deliveryBusinessDays?.message },
                )}
                {...register("deliveryBusinessDays")}
              />
            </InputGroup>
          </ProposalFormField>

          <ProposalFormField
            id="proposal-cancellation"
            label={t("Proposals.direct.revise.cancellation")}
            error={tError(errors.cancellationPolicy?.message)}
          >
            <Input
              {...PROPOSAL_INPUT_STYLES}
              id="proposal-cancellation"
              maxLength={200}
              aria-invalid={!!errors.cancellationPolicy}
              aria-describedby={proposalFieldDescribedBy(
                "proposal-cancellation",
                { error: errors.cancellationPolicy?.message },
              )}
              {...register("cancellationPolicy")}
            />
          </ProposalFormField>
        </SimpleGrid>

        <ProposalFormField
          id="proposal-notes"
          label={t("Proposals.direct.revise.notes")}
          error={tError(errors.notes?.message)}
        >
          <Textarea
            {...PROPOSAL_INPUT_STYLES}
            id="proposal-notes"
            minH="84.5px"
            py="13px"
            resize="vertical"
            maxLength={2000}
            placeholder={t("Proposals.direct.revise.notesPlaceholder")}
            aria-invalid={!!errors.notes}
            aria-describedby={proposalFieldDescribedBy("proposal-notes", {
              error: errors.notes?.message,
            })}
            {...register("notes")}
          />
        </ProposalFormField>
      </Stack>

      <ProposalsDialogFooter>
        <Button
          type="button"
          {...PROPOSALS_DIALOG_BUTTONS.secondary}
          onClick={onBack}
        >
          {t("Proposals.dialog.back")}
        </Button>
        <Button type="submit" {...PROPOSALS_DIALOG_BUTTONS.primary}>
          {t("Proposals.direct.revise.next")}
          <Icon as={LuArrowRight} boxSize="14px" />
        </Button>
      </ProposalsDialogFooter>
    </form>
  );
}
