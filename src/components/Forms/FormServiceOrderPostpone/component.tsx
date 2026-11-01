"use client";

import {
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import ProposalFormField, {
  PROPOSAL_INPUT_STYLES,
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import ServiceOrderDialogActions from "@/components/ServiceOrderDialogActions";
import {
  serviceOrderPostponeSchema,
  type ServiceOrderPostponeValues,
  todayInputValue,
} from "@/schemas/serviceOrders";
import { SERVICE_ORDER_RESCHEDULE_TYPES } from "@/types/serviceOrders";

import { FormServiceOrderPostponeProps } from "./interface";

// Campos do modal (Figma 2968-68398): fundo cinza, raio 12.
const FIELD = { ...PROPOSAL_INPUT_STYLES, h: "44px", rounded: "12px" } as const;
// Campos do bloco azul do reagendamento: fundo branco e borda azul.
const RESCHEDULE_FIELD = {
  ...FIELD,
  bg: "white",
  borderColor: "#C7D8FF",
} as const;

/**
 * "Adiar ordem de serviço" (Figma 2968-68398): nova data e horário, motivo e,
 * quando muda formalmente a agenda, o tipo e o motivo do reagendamento.
 */
export function FormServiceOrderPostpone({
  defaultValues,
  remainingReschedules,
  isSubmitting,
  onCancel,
  onSubmit,
}: FormServiceOrderPostponeProps) {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceOrderPostponeValues>({
    resolver: yupResolver(serviceOrderPostponeSchema),
    mode: "onSubmit",
    defaultValues: {
      date: "",
      time: "",
      reason: "",
      reschedule: false,
      rescheduleType: "internal",
      rescheduleReason: "",
      ...defaultValues,
    },
  });
  const reschedule = useWatch({ control, name: "reschedule" });
  const canReschedule = remainingReschedules > 0;

  const error = (message?: string) => (message ? t(message) : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="20px">
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="16px">
          <ProposalFormField
            id="postpone-date"
            label={t("ServiceOrders.postpone.date")}
            error={error(errors.date?.message)}
          >
            <Input
              {...FIELD}
              id="postpone-date"
              type="date"
              min={todayInputValue()}
              fontWeight={600}
              aria-invalid={!!errors.date}
              aria-describedby={proposalFieldDescribedBy("postpone-date", {
                error: errors.date?.message,
              })}
              {...register("date")}
            />
          </ProposalFormField>
          <ProposalFormField
            id="postpone-time"
            label={t("ServiceOrders.postpone.time")}
            error={error(errors.time?.message)}
          >
            <Input
              {...FIELD}
              id="postpone-time"
              type="time"
              fontWeight={600}
              aria-invalid={!!errors.time}
              aria-describedby={proposalFieldDescribedBy("postpone-time", {
                error: errors.time?.message,
              })}
              {...register("time")}
            />
          </ProposalFormField>
        </SimpleGrid>

        <ProposalFormField
          id="postpone-reason"
          label={t("ServiceOrders.postpone.reason")}
          error={error(errors.reason?.message)}
        >
          <Textarea
            {...FIELD}
            id="postpone-reason"
            h="auto"
            minH="80px"
            py="12px"
            resize="vertical"
            maxLength={1000}
            placeholder={t("ServiceOrders.postpone.reasonPlaceholder")}
            aria-invalid={!!errors.reason}
            aria-describedby={proposalFieldDescribedBy("postpone-reason", {
              error: errors.reason?.message,
            })}
            {...register("reason")}
          />
        </ProposalFormField>

        <Controller
          control={control}
          name="reschedule"
          render={({ field }) => (
            <Switch.Root
              checked={!!field.value}
              disabled={!canReschedule}
              onCheckedChange={(details) => field.onChange(details.checked)}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="16px"
              p="16px"
              bg="white"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="12px"
              cursor="pointer"
              _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
            >
              <Switch.HiddenInput onBlur={field.onBlur} />
              <Switch.Label flex="1" minW={0} cursor="inherit">
                <Text
                  as="span"
                  display="block"
                  color="#0F1729"
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                >
                  {t("ServiceOrders.postpone.reschedule")}
                </Text>
                <Text
                  as="span"
                  display="block"
                  pt="4px"
                  color="#8A9AB5"
                  fontSize="10px"
                  fontWeight={400}
                  lineHeight="15px"
                >
                  {t(
                    canReschedule
                      ? "ServiceOrders.postpone.rescheduleHint"
                      : "ServiceOrders.postpone.rescheduleExhausted",
                    { count: remainingReschedules },
                  )}
                </Text>
              </Switch.Label>
              <Switch.Control
                flexShrink={0}
                bg={field.value ? "#1F5AFF" : "#E5E8EE"}
              >
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          )}
        />

        {reschedule && (
          <SimpleGrid
            columns={{ base: 1, sm: 2 }}
            gap="16px"
            p="16px"
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            rounded="12px"
          >
            <ProposalFormField
              id="postpone-reschedule-type"
              label={t("ServiceOrders.postpone.rescheduleType")}
              error={error(errors.rescheduleType?.message)}
            >
              <NativeSelect.Root>
                <NativeSelect.Field
                  {...RESCHEDULE_FIELD}
                  id="postpone-reschedule-type"
                  fontWeight={600}
                  aria-invalid={!!errors.rescheduleType}
                  {...register("rescheduleType")}
                >
                  {SERVICE_ORDER_RESCHEDULE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`ServiceOrders.postpone.rescheduleTypes.${type}`)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="#5A6478" />
              </NativeSelect.Root>
            </ProposalFormField>
            <ProposalFormField
              id="postpone-reschedule-reason"
              label={t("ServiceOrders.postpone.rescheduleReason")}
              error={error(errors.rescheduleReason?.message)}
            >
              <Input
                {...RESCHEDULE_FIELD}
                id="postpone-reschedule-reason"
                maxLength={1000}
                placeholder={t(
                  "ServiceOrders.postpone.rescheduleReasonPlaceholder",
                )}
                aria-invalid={!!errors.rescheduleReason}
                aria-describedby={proposalFieldDescribedBy(
                  "postpone-reschedule-reason",
                  { error: errors.rescheduleReason?.message },
                )}
                {...register("rescheduleReason")}
              />
            </ProposalFormField>
          </SimpleGrid>
        )}

        <ServiceOrderDialogActions
          confirmLabel={t("ServiceOrders.postpone.confirm")}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </Stack>
    </form>
  );
}
