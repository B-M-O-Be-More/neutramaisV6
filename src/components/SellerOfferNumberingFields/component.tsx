"use client";

import { Input } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import OfferCategoryPanel, {
  OfferPanelField,
  offerPanelControlStyles,
  offerPanelDescribedBy,
} from "@/components/OfferCategoryPanel";
import { offerCategory } from "@/data/offerCategories";
import {
  OFFER_NUMBERING_TEXT_MAX,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { SellerOfferNumberingFieldsProps } from "./interface";

const TONE = offerCategory("numberingResources")!.tone;

type NumberingField = Extract<
  keyof SellerOfferValues,
  "numberingResourceType" | "numberingBlock" | "numberingHolder"
>;

const FIELDS: { name: NumberingField; key: string; id: string }[] = [
  {
    name: "numberingResourceType",
    key: "resourceType",
    id: "offer-numbering-type",
  },
  { name: "numberingBlock", key: "block", id: "offer-numbering-block" },
  { name: "numberingHolder", key: "holder", id: "offer-numbering-holder" },
];

/**
 * Documentação de Recursos Numéricos (Figma 2074-59682): tipo do recurso,
 * bloco/quantidade e titularidade/delegação (LACNIC/ANATEL), todos
 * obrigatórios. Aparece nas especificações técnicas só para essa categoria.
 */
export function SellerOfferNumberingFields({
  register,
  errors,
}: SellerOfferNumberingFieldsProps) {
  const { t } = useTranslation();

  return (
    <OfferCategoryPanel
      id="offer-numbering-title"
      title={t("SellerOfferCreate.numbering.title")}
      tone={TONE}
    >
      {FIELDS.map((field) => {
        const message = errors[field.name]?.message;
        const error = message ? t(message) : undefined;
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
