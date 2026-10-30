"use client";

import {
  Button,
  Checkbox,
  Flex,
  Icon,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import {
  LuCalendar,
  LuChevronDown,
  LuChevronRight,
  LuDollarSign,
  LuMapPin,
} from "react-icons/lu";

import ProposalFormField, {
  PROPOSAL_INPUT_STYLES,
  proposalFieldDescribedBy,
} from "@/components/ProposalFormField";
import {
  PROPOSALS_DIALOG_BUTTONS,
  ProposalsDialogFooter,
} from "@/components/ProposalsDialogFrame";
import ProposalsNotice from "@/components/ProposalsNotice";
import { offerCategory } from "@/data/offerCategories";
import { rfqDetailsSchema } from "@/schemas/proposals";
import {
  DEFAULT_RFQ_RESPONSE_HOURS,
  RFQ_RESPONSE_HOURS,
} from "@/types/proposals";

import { FormRfqDetailsProps, RfqDetailsValues } from "./interface";

/**
 * Etapa "Detalhes" da nova RFQ (Figma 2042-24288): produto, descrição
 * técnica, localização, orçamento, prazo de resposta, urgência e requisitos.
 */
export function FormRfqDetails({
  category,
  defaultValues,
  onChangeCategory,
  onBack,
  onSubmit,
}: FormRfqDetailsProps) {
  const { t } = useTranslation();
  const definition = offerCategory(category);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RfqDetailsValues>({
    resolver: yupResolver(rfqDetailsSchema),
    mode: "onBlur",
    defaultValues,
  });

  const tError = (message?: string) => (message ? t(message) : undefined);
  const describedBy = (id: string, error?: string) =>
    proposalFieldDescribedBy(id, { error });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="20px">
        {definition && (
          <Flex
            align="center"
            gap="8px"
            px="17px"
            py="11px"
            bg={definition.tone.bg}
            borderWidth="1px"
            borderColor={definition.tone.border}
            rounded="10px"
          >
            <Icon
              as={definition.icon}
              boxSize="20px"
              color={definition.tone.fg}
              aria-hidden
            />
            <Text
              flex="1"
              color={definition.tone.fg}
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {t(`SellerOfferCreate.categories.${category}.label`)}
            </Text>
            <Button
              variant="plain"
              h="auto"
              minW={0}
              p={0}
              color="#757575"
              fontSize="11px"
              fontWeight={500}
              lineHeight="16.5px"
              _hover={{ textDecoration: "underline" }}
              onClick={onChangeCategory}
            >
              {t("Proposals.rfq.create.change")}
            </Button>
          </Flex>
        )}

        <ProposalFormField
          id="rfq-product"
          label={t("Proposals.rfq.create.fields.product")}
          required
          error={tError(errors.productName?.message)}
        >
          <Input
            {...PROPOSAL_INPUT_STYLES}
            id="rfq-product"
            maxLength={200}
            placeholder={t("Proposals.rfq.create.fields.productPlaceholder")}
            aria-invalid={!!errors.productName}
            aria-describedby={describedBy(
              "rfq-product",
              errors.productName?.message,
            )}
            {...register("productName")}
          />
        </ProposalFormField>

        <ProposalFormField
          id="rfq-description"
          label={t("Proposals.rfq.create.fields.description")}
          required
          error={tError(errors.description?.message)}
        >
          <Textarea
            {...PROPOSAL_INPUT_STYLES}
            id="rfq-description"
            minH="104px"
            py="13px"
            resize="vertical"
            maxLength={2000}
            placeholder={t(
              "Proposals.rfq.create.fields.descriptionPlaceholder",
            )}
            aria-invalid={!!errors.description}
            aria-describedby={describedBy(
              "rfq-description",
              errors.description?.message,
            )}
            {...register("description")}
          />
        </ProposalFormField>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="16px">
          <ProposalFormField
            id="rfq-location"
            icon={LuMapPin}
            label={t("Proposals.rfq.create.fields.location")}
            required
            error={tError(errors.location?.message)}
          >
            <Input
              {...PROPOSAL_INPUT_STYLES}
              id="rfq-location"
              maxLength={200}
              placeholder={t("Proposals.rfq.create.fields.locationPlaceholder")}
              aria-invalid={!!errors.location}
              aria-describedby={describedBy(
                "rfq-location",
                errors.location?.message,
              )}
              {...register("location")}
            />
          </ProposalFormField>

          <ProposalFormField
            id="rfq-budget"
            icon={LuDollarSign}
            label={t("Proposals.rfq.create.fields.budget")}
            error={tError(errors.budget?.message)}
          >
            <Input
              {...PROPOSAL_INPUT_STYLES}
              id="rfq-budget"
              maxLength={200}
              placeholder={t("Proposals.rfq.create.fields.budgetPlaceholder")}
              aria-invalid={!!errors.budget}
              aria-describedby={describedBy(
                "rfq-budget",
                errors.budget?.message,
              )}
              {...register("budget")}
            />
          </ProposalFormField>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="16px">
          <ProposalFormField
            id="rfq-deadline"
            icon={LuCalendar}
            label={t("Proposals.rfq.create.fields.deadline")}
            error={tError(errors.responseHours?.message)}
          >
            <NativeSelect.Root w="fit-content" maxW="full">
              <NativeSelect.Field
                id="rfq-deadline"
                h="40px"
                ps="13px"
                pe="36px"
                bg="white"
                borderWidth="1px"
                borderColor="#A0ABB8"
                rounded="14px"
                color="#0A0D14"
                fontSize="14px"
                lineHeight="20px"
                {...register("responseHours")}
              >
                {RFQ_RESPONSE_HOURS.map((hours) => (
                  <option key={hours} value={hours}>
                    {t(
                      hours === DEFAULT_RFQ_RESPONSE_HOURS
                        ? "Proposals.rfq.create.fields.deadlineDefault"
                        : "Proposals.rfq.create.fields.deadlineOption",
                      { count: hours },
                    )}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator>
                <LuChevronDown color="#0A0D14" />
              </NativeSelect.Indicator>
            </NativeSelect.Root>
          </ProposalFormField>

          <Controller
            control={control}
            name="urgent"
            render={({ field }) => (
              <Checkbox.Root
                checked={field.value}
                onCheckedChange={(details) =>
                  field.onChange(details.checked === true)
                }
                alignItems="center"
                gap="12px"
                pt={{ base: 0, sm: "24px" }}
                colorPalette="blue"
              >
                <Checkbox.HiddenInput name={field.name} onBlur={field.onBlur} />
                <Checkbox.Control
                  boxSize="16px"
                  rounded="2px"
                  borderColor="#767676"
                />
                <Checkbox.Label>
                  <Text
                    as="span"
                    display="block"
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={600}
                    lineHeight="19.5px"
                  >
                    {t("Proposals.rfq.create.fields.urgent")}
                  </Text>
                  <Text
                    as="span"
                    display="block"
                    color="#A0ABB8"
                    fontSize="11px"
                    fontWeight={400}
                    lineHeight="16.5px"
                  >
                    {t("Proposals.rfq.create.fields.urgentHint")}
                  </Text>
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />
        </SimpleGrid>

        <ProposalFormField
          id="rfq-requirements"
          label={t("Proposals.rfq.create.fields.requirements")}
          error={tError(errors.requirements?.message)}
        >
          <Textarea
            {...PROPOSAL_INPUT_STYLES}
            id="rfq-requirements"
            minH="84.5px"
            py="13px"
            resize="vertical"
            maxLength={2000}
            placeholder={t(
              "Proposals.rfq.create.fields.requirementsPlaceholder",
            )}
            aria-invalid={!!errors.requirements}
            aria-describedby={describedBy(
              "rfq-requirements",
              errors.requirements?.message,
            )}
            {...register("requirements")}
          />
        </ProposalFormField>

        <ProposalsNotice tone="info">
          <Trans
            i18nKey="Proposals.rfq.create.detailsNotice"
            components={{ b: <strong /> }}
          />
        </ProposalsNotice>
      </Stack>

      <ProposalsDialogFooter gap="25px">
        <Button
          type="button"
          {...PROPOSALS_DIALOG_BUTTONS.secondary}
          minH="47px"
          onClick={onBack}
        >
          {t("Proposals.dialog.back")}
        </Button>
        <Button
          type="submit"
          {...PROPOSALS_DIALOG_BUTTONS.primary}
          minH="47px"
          flex="2"
        >
          {t("Proposals.rfq.create.review")}
          <Icon as={LuChevronRight} boxSize="15px" />
        </Button>
      </ProposalsDialogFooter>
    </form>
  );
}
