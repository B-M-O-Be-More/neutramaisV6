"use client";

import { SimpleGrid, Text } from "@chakra-ui/react";
import type { FactoryOpts } from "imask";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import OfferCategoryPanel, {
  OfferPanelField,
  offerPanelControlStyles,
  offerPanelDescribedBy,
} from "@/components/OfferCategoryPanel";
import OfferMaskedInput, {
  MONEY_MASK,
  POSTAL_CODE_MASK,
  SIDE_CM_MASK,
  WEIGHT_KG_MASK,
} from "@/components/OfferMaskedInput";
import { offerCategory } from "@/data/offerCategories";
import type { SellerOfferValues } from "@/schemas/sellerOffer";

import { SellerOfferShippingFieldsProps } from "./interface";

const TONE = offerCategory("hardware")!.tone;

type ShippingField = Extract<
  keyof SellerOfferValues,
  | "shippingWeightKg"
  | "shippingHeightCm"
  | "shippingWidthCm"
  | "shippingLengthCm"
  | "shippingOriginPostalCode"
  | "shippingInsuranceValue"
>;

interface FieldConfig {
  name: ShippingField;
  id: string;
  labelKey: string;
  mask: FactoryOpts;
  inputMode: "decimal" | "numeric";
  placeholder: string;
  required: boolean;
}

const MEASURES: FieldConfig[] = [
  {
    name: "shippingWeightKg",
    id: "offer-shipping-weight",
    labelKey: "weightLabel",
    mask: WEIGHT_KG_MASK,
    inputMode: "decimal",
    placeholder: "1,250",
    required: true,
  },
  {
    name: "shippingHeightCm",
    id: "offer-shipping-height",
    labelKey: "heightLabel",
    mask: SIDE_CM_MASK,
    inputMode: "decimal",
    placeholder: "10",
    required: true,
  },
  {
    name: "shippingWidthCm",
    id: "offer-shipping-width",
    labelKey: "widthLabel",
    mask: SIDE_CM_MASK,
    inputMode: "decimal",
    placeholder: "25",
    required: true,
  },
  {
    name: "shippingLengthCm",
    id: "offer-shipping-length",
    labelKey: "lengthLabel",
    mask: SIDE_CM_MASK,
    inputMode: "decimal",
    placeholder: "30",
    required: true,
  },
];

const ORIGIN: FieldConfig[] = [
  {
    name: "shippingOriginPostalCode",
    id: "offer-shipping-postal-code",
    labelKey: "postalCodeLabel",
    mask: POSTAL_CODE_MASK,
    inputMode: "numeric",
    placeholder: "01310-100",
    required: true,
  },
  {
    name: "shippingInsuranceValue",
    id: "offer-shipping-insurance",
    labelKey: "insuranceLabel",
    mask: MONEY_MASK,
    inputMode: "decimal",
    placeholder: "0,00",
    required: false,
  },
];

/**
 * Envio do produto físico (Hardware / CPE): peso e medidas de UMA unidade
 * embalada, o CEP de onde o seller despacha e o valor declarado para o seguro
 * (opcional — sem ele, vale o preço). Vai em `shipping` no POST e no PATCH;
 * publicar exige o pacote.
 */
export function SellerOfferShippingFields({
  control,
  errors,
}: SellerOfferShippingFieldsProps) {
  const { t } = useTranslation();

  const renderField = (field: FieldConfig) => {
    const message = errors[field.name]?.message;
    const error = message ? t(message) : undefined;
    return (
      <OfferPanelField
        key={field.id}
        id={field.id}
        label={t(`SellerOfferCreate.shipping.${field.labelKey}`)}
        required={field.required}
        error={error}
      >
        <Controller
          control={control}
          name={field.name}
          render={({ field: controller }) => (
            <OfferMaskedInput
              id={field.id}
              ref={controller.ref}
              name={controller.name}
              maskOptions={field.mask}
              value={controller.value ?? ""}
              onAccept={controller.onChange}
              onBlur={controller.onBlur}
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              aria-invalid={!!error}
              aria-describedby={offerPanelDescribedBy(field.id, error)}
              {...offerPanelControlStyles(TONE, error)}
            />
          )}
        />
      </OfferPanelField>
    );
  };

  return (
    <OfferCategoryPanel
      id="offer-shipping-title"
      title={t("SellerOfferCreate.shipping.title")}
      tone={TONE}
    >
      <Text color="#5A6478" fontSize="12px" lineHeight="18px">
        {t("SellerOfferCreate.shipping.description")}
      </Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
        {MEASURES.map(renderField)}
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
        {ORIGIN.map(renderField)}
      </SimpleGrid>
    </OfferCategoryPanel>
  );
}
