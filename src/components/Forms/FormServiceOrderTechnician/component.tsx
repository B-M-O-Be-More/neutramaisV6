"use client";

import { Input, SimpleGrid, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import OfferMaskedInput from "@/components/OfferMaskedInput";
import ProposalFormField, {
  PROPOSAL_INPUT_STYLES,
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import ServiceOrderDialogActions from "@/components/ServiceOrderDialogActions";
import {
  serviceOrderTechnicianSchema,
  type ServiceOrderTechnicianValues,
} from "@/schemas/serviceOrders";

import { FormServiceOrderTechnicianProps } from "./interface";

const FIELD = { ...PROPOSAL_INPUT_STYLES, h: "44px", rounded: "12px" } as const;

/** Celular ou fixo brasileiro; a máscara se ajusta ao 9º dígito. */
const PHONE_MASK = {
  mask: [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }],
};

/**
 * "Cadastrar novo" técnico da equipe do seller (Figma 2968-70259): nome,
 * e-mail, telefone e especialidade.
 */
export function FormServiceOrderTechnician({
  confirmLabel,
  isSubmitting,
  onCancel,
  onSubmit,
}: FormServiceOrderTechnicianProps) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceOrderTechnicianValues>({
    resolver: yupResolver(serviceOrderTechnicianSchema),
    mode: "onSubmit",
    defaultValues: { name: "", email: "", phone: "", specialty: "" },
  });

  const error = (message?: string) => (message ? t(message) : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="20px">
        <ProposalFormField
          id="technician-name"
          label={t("ServiceOrders.technician.name")}
          error={error(errors.name?.message)}
        >
          <Input
            {...FIELD}
            id="technician-name"
            autoComplete="name"
            maxLength={120}
            placeholder={t("ServiceOrders.technician.namePlaceholder")}
            aria-invalid={!!errors.name}
            aria-describedby={proposalFieldDescribedBy("technician-name", {
              error: errors.name?.message,
            })}
            {...register("name")}
          />
        </ProposalFormField>

        <ProposalFormField
          id="technician-email"
          label={t("ServiceOrders.technician.email")}
          error={error(errors.email?.message)}
        >
          <Input
            {...FIELD}
            id="technician-email"
            type="email"
            autoComplete="email"
            maxLength={120}
            placeholder={t("ServiceOrders.technician.emailPlaceholder")}
            aria-invalid={!!errors.email}
            aria-describedby={proposalFieldDescribedBy("technician-email", {
              error: errors.email?.message,
            })}
            {...register("email")}
          />
        </ProposalFormField>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="16px">
          <ProposalFormField
            id="technician-phone"
            label={t("ServiceOrders.technician.phone")}
            error={error(errors.phone?.message)}
          >
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <OfferMaskedInput
                  {...FIELD}
                  id="technician-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maskOptions={PHONE_MASK}
                  placeholder="(00) 00000-0000"
                  value={field.value}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.phone}
                  aria-describedby={proposalFieldDescribedBy(
                    "technician-phone",
                    { error: errors.phone?.message },
                  )}
                />
              )}
            />
          </ProposalFormField>
          <ProposalFormField
            id="technician-specialty"
            label={t("ServiceOrders.technician.specialty")}
            error={error(errors.specialty?.message)}
          >
            <Input
              {...FIELD}
              id="technician-specialty"
              maxLength={120}
              placeholder={t("ServiceOrders.technician.specialtyPlaceholder")}
              aria-invalid={!!errors.specialty}
              aria-describedby={proposalFieldDescribedBy(
                "technician-specialty",
                { error: errors.specialty?.message },
              )}
              {...register("specialty")}
            />
          </ProposalFormField>
        </SimpleGrid>

        <ServiceOrderDialogActions
          confirmLabel={confirmLabel}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </Stack>
    </form>
  );
}
