"use client";

import { Input, NativeSelect } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import OfferCategoryPanel, {
  OfferPanelField,
  offerPanelControlStyles,
  offerPanelDescribedBy,
} from "@/components/OfferCategoryPanel";
import { offerCategory } from "@/data/offerCategories";
import {
  NUMBERING_RESOURCE_TYPES,
  OFFER_NUMBERING_TEXT_MAX,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { SellerOfferNumberingFieldsProps } from "./interface";

const TONE = offerCategory("numberingResources")!.tone;

type NumberingTextField = Extract<
  keyof SellerOfferValues,
  "numberingBlock" | "numberingHolder"
>;

const TEXT_FIELDS: { name: NumberingTextField; key: string; id: string }[] = [
  { name: "numberingBlock", key: "block", id: "offer-numbering-block" },
  { name: "numberingHolder", key: "holder", id: "offer-numbering-holder" },
];

/**
 * Documentação de Recursos Numéricos (Figma 2074-59682), os campos do
 * template da categoria: tipo do recurso (lista do template), bloco/quantidade
 * e titularidade/uso permitido, todos obrigatórios. O registro (LACNIC,
 * ANATEL...) fica na etapa 1. Aparece nas especificações técnicas só para
 * essa categoria.
 */
export function SellerOfferNumberingFields({
  register,
  errors,
}: SellerOfferNumberingFieldsProps) {
  const { t } = useTranslation();
  const tError = (message?: string) => (message ? t(message) : undefined);
  const typeError = tError(errors.numberingResourceType?.message);

  return (
    <OfferCategoryPanel
      id="offer-numbering-title"
      title={t("SellerOfferCreate.numbering.title")}
      tone={TONE}
    >
      <OfferPanelField
        id="offer-numbering-type"
        label={t("SellerOfferCreate.numbering.resourceTypeLabel")}
        required
        error={typeError}
      >
        <NativeSelect.Root>
          <NativeSelect.Field
            id="offer-numbering-type"
            {...register("numberingResourceType")}
            aria-invalid={!!typeError}
            aria-describedby={offerPanelDescribedBy(
              "offer-numbering-type",
              typeError,
            )}
            {...offerPanelControlStyles(TONE, typeError)}
            pe="32px"
          >
            <option value="">
              {t("SellerOfferCreate.numbering.resourceTypePlaceholder")}
            </option>
            {NUMBERING_RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`SellerOfferCreate.numbering.resourceTypes.${type}`)}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator>
            <LuChevronDown color="#98A6B3" />
          </NativeSelect.Indicator>
        </NativeSelect.Root>
      </OfferPanelField>

      {TEXT_FIELDS.map((field) => {
        const error = tError(errors[field.name]?.message);
        return (
          <OfferPanelField
            key={field.name}
            id={field.id}
            label={t(`SellerOfferCreate.numbering.${field.key}Label`)}
            required
            error={error}
          >
            <Input
              id={field.id}
              {...register(field.name)}
              maxLength={OFFER_NUMBERING_TEXT_MAX}
              placeholder={t(
                `SellerOfferCreate.numbering.${field.key}Placeholder`,
              )}
              aria-invalid={!!error}
              aria-describedby={offerPanelDescribedBy(field.id, error)}
              {...offerPanelControlStyles(TONE, error)}
            />
          </OfferPanelField>
        );
      })}
    </OfferCategoryPanel>
  );
}
