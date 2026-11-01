"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuInfo, LuMinus, LuPlus, LuX } from "react-icons/lu";

import OfferCategoryPanel, {
  offerPanelDescribedBy,
  type OfferCategoryPanelTone,
} from "@/components/OfferCategoryPanel";
import { Tooltip } from "@/components/ui/tooltip";
import {
  EMPTY_OFFER_ATTRIBUTE,
  OFFER_ATTRIBUTE_NAME_MAX,
  OFFER_ATTRIBUTE_TYPES,
  OFFER_ATTRIBUTE_VALUES_MAX,
  OFFER_ATTRIBUTES_MAX,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { SellerOfferAttributesFieldsProps } from "./interface";

const LABEL = "#5A6478";
const BORDER = "#E5E8EE";
const ERROR = "#EF4444";

/** Campo dos atributos: cinza vazio, branco preenchido (Figma 3009-74313). */
function controlStyles(
  tone: OfferCategoryPanelTone,
  filled: boolean,
  error?: string,
) {
  return {
    h: "47px",
    px: "17px",
    bg: filled ? "white" : "#F8F9FB",
    borderWidth: "1px",
    borderColor: error ? ERROR : BORDER,
    rounded: "14px",
    color: "#0F1729",
    fontSize: "14px",
    focusRingColor: tone.fg,
    _placeholder: { color: "rgba(15,23,41,0.5)" },
  } as const;
}

const rowButton = {
  boxSize: "47px",
  minW: "47px",
  p: 0,
  bg: "#F7F8FA",
  borderWidth: "1px",
  borderColor: BORDER,
  rounded: "14px",
  color: LABEL,
  _hover: { bg: "#EEF1F5", color: "#0F1729" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
} as const;

/**
 * Atributos da oferta (Figma 3009-74313 Conectividade, 2879-92995 Hardware):
 * nome, tipo de dado e valores separados por vírgula, nas cores da
 * categoria. O "+" da última linha acrescenta outra; o "−" remove a da
 * linha. Opcionais: linha começada exige os três campos. Vão no
 * `metadata.additionalProps` da oferta.
 */
export function SellerOfferAttributesFields({
  control,
  errors,
  tone,
}: SellerOfferAttributesFieldsProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });
  const canAdd = fields.length < OFFER_ATTRIBUTES_MAX;

  return (
    <OfferCategoryPanel
      id="offer-attributes-title"
      title={t("SellerOfferCreate.attributes.title")}
      tone={tone}
    >
      {fields.map((field, index) => (
        <AttributeRow
          key={field.id}
          control={control}
          errors={errors}
          tone={tone}
          index={index}
          isLast={index === fields.length - 1}
          canRemove={fields.length > 1}
          canAdd={canAdd}
          onAdd={() => append({ ...EMPTY_OFFER_ATTRIBUTE })}
          onRemove={() => remove(index)}
        />
      ))}
      {!canAdd && (
        <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {t("SellerOfferCreate.attributes.max", { max: OFFER_ATTRIBUTES_MAX })}
        </Text>
      )}
    </OfferCategoryPanel>
  );
}

interface AttributeRowProps {
  control: Control<SellerOfferValues>;
  errors: FieldErrors<SellerOfferValues>;
  tone: OfferCategoryPanelTone;
  index: number;
  isLast: boolean;
  canRemove: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

/** Uma linha: nome, tipo de dado, valores e os botões − / +. */
function AttributeRow({
  control,
  errors,
  tone,
  index,
  isLast,
  canRemove,
  canAdd,
  onAdd,
  onRemove,
}: AttributeRowProps) {
  const { t } = useTranslation();
  const tError = (message?: string) => (message ? t(message) : undefined);
  const rowErrors = errors.attributes?.[index];
  const nameError = tError(rowErrors?.name?.message);
  const typeError = tError(rowErrors?.type?.message);
  const valuesError = tError(rowErrors?.values?.message);

  const number = index + 1;
  const nameId = `offer-attribute-${index}-name`;
  const typeId = `offer-attribute-${index}-type`;
  const valuesId = `offer-attribute-${index}-values`;
  const valuesHint = t("SellerOfferCreate.attributes.valuesHint");

  return (
    <Grid
      role="group"
      aria-label={t("SellerOfferCreate.attributes.rowLabel", { number })}
      templateColumns={{
        base: "minmax(0, 1fr)",
        lg: "164px 250px minmax(0, 1fr)",
      }}
      gap="12px"
      alignItems="start"
    >
      <AttributeField
        id={nameId}
        label={t("SellerOfferCreate.attributes.nameLabel")}
        error={nameError}
      >
        <ClearableInput
          id={nameId}
          control={control}
          name={`attributes.${index}.name`}
          maxLength={OFFER_ATTRIBUTE_NAME_MAX}
          placeholder={t("SellerOfferCreate.attributes.namePlaceholder")}
          clearLabel={t("SellerOfferCreate.attributes.clearName", { number })}
          tone={tone}
          error={nameError}
        />
      </AttributeField>

      <AttributeField
        id={typeId}
        label={t("SellerOfferCreate.attributes.typeLabel")}
        error={typeError}
      >
        <Controller
          control={control}
          name={`attributes.${index}.type`}
          render={({ field }) => (
            <NativeSelect.Root>
              <NativeSelect.Field
                id={typeId}
                ref={field.ref}
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!typeError}
                aria-describedby={offerPanelDescribedBy(typeId, typeError)}
                {...controlStyles(tone, !!field.value, typeError)}
                pe="44px"
                color={field.value ? "#0F1729" : "rgba(15,23,41,0.5)"}
              >
                <option value="">
                  {t("SellerOfferCreate.attributes.typePlaceholder")}
                </option>
                {OFFER_ATTRIBUTE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`SellerOfferCreate.attributes.types.${type}`)}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator pe="6px">
                <Icon as={LuChevronDown} boxSize="18px" color={LABEL} />
              </NativeSelect.Indicator>
            </NativeSelect.Root>
          )}
        />
      </AttributeField>

      <Flex gap="16px" align="start" minW={0}>
        <Box flex="1" minW={0}>
          <AttributeField
            id={valuesId}
            label={t("SellerOfferCreate.attributes.valuesLabel")}
            hint={valuesHint}
            error={valuesError}
          >
            <ClearableInput
              id={valuesId}
              control={control}
              name={`attributes.${index}.values`}
              maxLength={OFFER_ATTRIBUTE_VALUES_MAX}
              placeholder={t("SellerOfferCreate.attributes.valuesPlaceholder")}
              clearLabel={t("SellerOfferCreate.attributes.clearValues", {
                number,
              })}
              tone={tone}
              error={valuesError}
            />
          </AttributeField>
        </Box>
        {/* Os botões ficam na altura do campo, abaixo do rótulo. */}
        <Flex gap="8px" pt="22px" flexShrink={0}>
          {canRemove && (
            <Button
              {...rowButton}
              aria-label={t("SellerOfferCreate.attributes.remove", { number })}
              onClick={onRemove}
            >
              <Icon as={LuMinus} boxSize="15px" />
            </Button>
          )}
          {isLast && (
            <Button
              {...rowButton}
              aria-label={t("SellerOfferCreate.attributes.add")}
              disabled={!canAdd}
              onClick={onAdd}
            >
              <Icon as={LuPlus} boxSize="15px" />
            </Button>
          )}
        </Flex>
      </Flex>
    </Grid>
  );
}

interface AttributeFieldProps {
  id: string;
  label: string;
  /** Dica do ícone de informação ao lado do rótulo. */
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Rótulo cinza 12px (com a dica opcional), controle e erro. */
function AttributeField({
  id,
  label,
  hint,
  error,
  children,
}: AttributeFieldProps) {
  return (
    <Stack gap={0} minW={0}>
      <Flex h="22px" pb="4px" align="center" justify="space-between">
        <Text
          asChild
          color={LABEL}
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
        >
          <label htmlFor={id}>{label}</label>
        </Text>
        {hint && (
          <Tooltip content={hint} showArrow>
            <Box
              asChild
              display="flex"
              color="#C4CDD8"
              rounded="full"
              cursor="help"
              _hover={{ color: LABEL }}
            >
              <button type="button" aria-label={hint}>
                <Icon as={LuInfo} boxSize="17px" />
              </button>
            </Box>
          </Tooltip>
        )}
      </Flex>
      {children}
      {error && (
        <Text
          id={`${id}-error`}
          pt="4px"
          color={ERROR}
          fontSize="12px"
          lineHeight="18px"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
}

interface ClearableInputProps {
  id: string;
  control: Control<SellerOfferValues>;
  name: `attributes.${number}.name` | `attributes.${number}.values`;
  maxLength: number;
  placeholder: string;
  clearLabel: string;
  tone: OfferCategoryPanelTone;
  error?: string;
}

/** Campo de texto com o "×" que limpa o conteúdo (Figma 3009-74321). */
function ClearableInput({
  id,
  control,
  name,
  maxLength,
  placeholder,
  clearLabel,
  tone,
  error,
}: ClearableInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <InputGroup
          endElement={
            <Button
              variant="plain"
              minW="auto"
              h="auto"
              p="3px"
              color={LABEL}
              rounded="full"
              aria-label={clearLabel}
              disabled={!field.value}
              _hover={{ color: "#0F1729" }}
              _disabled={{ opacity: 1, cursor: "default" }}
              onClick={() => field.onChange("")}
            >
              <Icon as={LuX} boxSize="15px" />
            </Button>
          }
          endElementProps={{ pe: "14px", pointerEvents: "auto" }}
        >
          <Input
            id={id}
            ref={field.ref}
            name={field.name}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={offerPanelDescribedBy(id, error)}
            {...controlStyles(tone, !!field.value, error)}
            pe="44px"
          />
        </InputGroup>
      )}
    />
  );
}
