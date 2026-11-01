"use client";

import {
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuSend, LuX } from "react-icons/lu";

import OfferMaskedInput, { MONEY_MASK } from "@/components/OfferMaskedInput";
import ProposalFormField, {
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import { sellerRfqProposalSchema } from "@/schemas/sellerInbox";
import { SELLER_RFQ_VALIDITY_DAYS } from "@/types/sellerRfqs";

import {
  FormSellerRfqProposalProps,
  SellerRfqProposalValues,
} from "./interface";

// Campos do painel violeta (Figma 2948-52435): fundo branco, borda lilás.
const FIELD_STYLES = {
  h: "37.5px",
  px: "11px",
  bg: "white",
  borderWidth: "1px",
  borderColor: "#D3BFFD",
  rounded: "8px",
  color: "#09090B",
  fontSize: "13px",
  lineHeight: "19.5px",
  focusRingColor: "#8B5CF6",
  _placeholder: { color: "rgba(9,9,11,0.5)" },
} as const;

/**
 * "Enviar proposta" de uma RFQ recebida (Figma 2948-52423): preço em BRL,
 * SLA técnico, prazo de entrega, validade, vistoria e observações. Também
 * serve para atualizar a proposta (gera nova versão).
 */
export function FormSellerRfqProposal({
  id,
  defaultValues,
  isSubmitting,
  onClose,
  onSubmit,
}: FormSellerRfqProposalProps) {
  const { t } = useTranslation();
  const fieldId = (name: string) => `${id}-${name}`;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SellerRfqProposalValues>({
    resolver: yupResolver(sellerRfqProposalSchema),
    mode: "onSubmit",
    defaultValues,
  });

  const tError = (message?: string) => (message ? t(message) : undefined);
  const describedBy = (name: string, error?: string) =>
    proposalFieldDescribedBy(fieldId(name), { error });

  return (
    <Stack
      asChild
      gap="16px"
      p="20px"
      bg="#F3EEFF"
      borderWidth="1px"
      borderColor="#D3BFFD"
      rounded="12px"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-labelledby={fieldId("title")}
      >
        <Flex align="center" justify="space-between" gap="12px">
          <Text
            id={fieldId("title")}
            color="#8B5CF6"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {t("SellerOrders.rfq.form.title")}
          </Text>
          <IconButton
            type="button"
            variant="plain"
            boxSize="24px"
            minW="24px"
            color="#8A9AB5"
            aria-label={t("SellerOrders.rfq.form.close")}
            disabled={isSubmitting}
            onClick={onClose}
          >
            <Icon as={LuX} boxSize="16px" />
          </IconButton>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
          <ProposalFormField
            id={fieldId("price")}
            label={t("SellerOrders.rfq.form.price", { currency: "BRL" })}
            required
            error={tError(errors.price?.message)}
          >
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <OfferMaskedInput
                  {...FIELD_STYLES}
                  id={fieldId("price")}
                  name={field.name}
                  maskOptions={MONEY_MASK}
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={field.value}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  aria-invalid={!!errors.price}
                  aria-describedby={describedBy("price", errors.price?.message)}
                />
              )}
            />
          </ProposalFormField>

          <ProposalFormField
            id={fieldId("sla")}
            label={t("SellerOrders.rfq.form.sla")}
            required
            error={tError(errors.sla?.message)}
          >
            <Input
              {...FIELD_STYLES}
              id={fieldId("sla")}
              maxLength={200}
              placeholder={t("SellerOrders.rfq.form.slaPlaceholder")}
              aria-invalid={!!errors.sla}
              aria-describedby={describedBy("sla", errors.sla?.message)}
              {...register("sla")}
            />
          </ProposalFormField>

          <ProposalFormField
            id={fieldId("delivery")}
            label={t("SellerOrders.rfq.form.delivery")}
            required
            error={tError(errors.deliveryDays?.message)}
          >
            <InputGroup
              endElement={
                <Text color="#8A9AB5" fontSize="13px" aria-hidden>
                  {t("SellerOrders.rfq.form.days")}
                </Text>
              }
            >
              <Input
                {...FIELD_STYLES}
                id={fieldId("delivery")}
                type="number"
                inputMode="numeric"
                min={1}
                max={730}
                aria-invalid={!!errors.deliveryDays}
                aria-describedby={describedBy(
                  "delivery",
                  errors.deliveryDays?.message,
                )}
                {...register("deliveryDays")}
              />
            </InputGroup>
          </ProposalFormField>

          <ProposalFormField
            id={fieldId("validity")}
            label={t("SellerOrders.rfq.form.validity")}
            required
            error={tError(errors.validityDays?.message)}
          >
            <NativeSelect.Root>
              <NativeSelect.Field
                {...FIELD_STYLES}
                id={fieldId("validity")}
                aria-invalid={!!errors.validityDays}
                aria-describedby={describedBy(
                  "validity",
                  errors.validityDays?.message,
                )}
                {...register("validityDays")}
              >
                {SELLER_RFQ_VALIDITY_DAYS.map((days) => (
                  <option key={days} value={days}>
                    {t("SellerOrders.rfq.daysValue", { count: days })}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="#0F1729" />
            </NativeSelect.Root>
          </ProposalFormField>
        </SimpleGrid>

        <Controller
          control={control}
          name="requiresSiteSurvey"
          render={({ field }) => (
            <Checkbox.Root
              checked={field.value}
              onCheckedChange={(event) =>
                field.onChange(event.checked === true)
              }
              colorPalette="purple"
              gap="8px"
            >
              <Checkbox.HiddenInput onBlur={field.onBlur} />
              <Checkbox.Control
                boxSize="16px"
                rounded="2px"
                borderColor="#767676"
                _checked={{ bg: "#8B5CF6", borderColor: "#8B5CF6" }}
              />
              <Checkbox.Label
                color="#5A6478"
                fontSize="12px"
                fontWeight={400}
                lineHeight="18px"
              >
                {t("SellerOrders.rfq.form.siteSurvey")}
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />

        <Stack gap="4px">
          <Textarea
            {...FIELD_STYLES}
            id={fieldId("notes")}
            h="auto"
            minH="84.5px"
            p="12px"
            resize="vertical"
            maxLength={2000}
            placeholder={t("SellerOrders.rfq.form.notesPlaceholder")}
            aria-label={t("SellerOrders.rfq.form.notes")}
            aria-invalid={!!errors.notes}
            aria-describedby={describedBy("notes", errors.notes?.message)}
            {...register("notes")}
          />
          {errors.notes?.message && (
            <Text
              id={`${fieldId("notes")}-error`}
              color="#EF4444"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(errors.notes.message)}
            </Text>
          )}
        </Stack>

        <Flex gap="8px" wrap="wrap">
          <Button
            type="button"
            variant="plain"
            h="auto"
            px="16px"
            py="8px"
            rounded="8px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#5A6478"
            fontSize="13px"
            fontWeight={400}
            lineHeight="19.5px"
            _hover={{ bg: "white" }}
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t("SellerOrders.actions.cancel")}
          </Button>
          <Button
            type="submit"
            h="auto"
            px="20px"
            py="10px"
            gap="8px"
            rounded="8px"
            bg="#8B5CF6"
            color="white"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            _hover={{ bg: "#7C4DEB" }}
            loading={isSubmitting}
          >
            <Icon as={LuSend} boxSize="13px" />
            {t("SellerOrders.rfq.form.submit")}
          </Button>
        </Flex>
      </form>
    </Stack>
  );
}
