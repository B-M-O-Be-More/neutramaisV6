"use client";

import { Input, NativeSelect, SimpleGrid, Textarea } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import OfferCategoryPanel, {
  OfferPanelField,
  offerPanelControlStyles,
  offerPanelDescribedBy,
} from "@/components/OfferCategoryPanel";
import { offerCategory } from "@/data/offerCategories";
import {
  INFRA_SOLD_UNITS,
  OFFER_INFRA_DETAILS_MAX,
  OFFER_INFRA_TEXT_MAX,
} from "@/schemas/sellerOffer";

import { SellerOfferInfraFieldsProps } from "./interface";

const TONE = offerCategory("physicalInfra")!.tone;

/**
 * Campos obrigatórios de Infra Física, os do template da categoria:
 * capacidade, unidade vendida e energia/espaço/porta. A localidade é a
 * primeira da etapa 1. Aparece nas especificações técnicas só para essa
 * categoria.
 */
export function SellerOfferInfraFields({
  register,
  errors,
}: SellerOfferInfraFieldsProps) {
  const { t } = useTranslation();
  const tError = (message?: string) => (message ? t(message) : undefined);

  const capacityError = tError(errors.infraCapacity?.message);
  const soldUnitError = tError(errors.infraSoldUnit?.message);
  const detailsError = tError(errors.infraPowerSpacePort?.message);

  return (
    <OfferCategoryPanel
      id="offer-infra-title"
      title={t("SellerOfferCreate.infra.title")}
      tone={TONE}
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
        <OfferPanelField
          id="offer-infra-capacity"
          label={t("SellerOfferCreate.infra.capacityLabel")}
          required
          error={capacityError}
        >
          <Input
            id="offer-infra-capacity"
            {...register("infraCapacity")}
            maxLength={OFFER_INFRA_TEXT_MAX}
            placeholder={t("SellerOfferCreate.infra.capacityPlaceholder")}
            aria-invalid={!!capacityError}
            aria-describedby={offerPanelDescribedBy(
              "offer-infra-capacity",
              capacityError,
            )}
            {...offerPanelControlStyles(TONE, capacityError)}
          />
        </OfferPanelField>

        <OfferPanelField
          id="offer-infra-sold-unit"
          label={t("SellerOfferCreate.infra.soldUnitLabel")}
          required
          error={soldUnitError}
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              id="offer-infra-sold-unit"
              {...register("infraSoldUnit")}
              aria-invalid={!!soldUnitError}
              aria-describedby={offerPanelDescribedBy(
                "offer-infra-sold-unit",
                soldUnitError,
              )}
              {...offerPanelControlStyles(TONE, soldUnitError)}
              pe="32px"
            >
              <option value="">
                {t("SellerOfferCreate.infra.soldUnitPlaceholder")}
              </option>
              {INFRA_SOLD_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`SellerOfferCreate.infra.soldUnits.${unit}`)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#98A6B3" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
        </OfferPanelField>
      </SimpleGrid>

      <OfferPanelField
        id="offer-infra-power-space-port"
        label={t("SellerOfferCreate.infra.powerSpacePortLabel")}
        required
        error={detailsError}
      >
        <Textarea
          id="offer-infra-power-space-port"
          {...register("infraPowerSpacePort")}
          maxLength={OFFER_INFRA_DETAILS_MAX}
          placeholder={t("SellerOfferCreate.infra.powerSpacePortPlaceholder")}
          aria-invalid={!!detailsError}
          aria-describedby={offerPanelDescribedBy(
            "offer-infra-power-space-port",
            detailsError,
          )}
          {...offerPanelControlStyles(TONE, detailsError)}
          h="auto"
          minH="83px"
          py="10px"
        />
      </OfferPanelField>
    </OfferCategoryPanel>
  );
}
