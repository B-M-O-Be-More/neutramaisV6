"use client";

import { Input, NativeSelect, SimpleGrid } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import OfferCategoryPanel, {
  OfferPanelField,
  offerPanelControlStyles,
  offerPanelDescribedBy,
} from "@/components/OfferCategoryPanel";
import { offerCategory } from "@/data/offerCategories";
import {
  HARDWARE_CONDITIONS,
  OFFER_HARDWARE_TEXT_MAX,
} from "@/schemas/sellerOffer";

import { SellerOfferHardwareFieldsProps } from "./interface";

const TONE = offerCategory("hardware")!.tone;

/**
 * Campos obrigatórios de Hardware / CPE (Figma 2074-56987): fabricante,
 * modelo e condição, além de garantia e serialização. Aparece nas
 * especificações técnicas só para essa categoria.
 */
export function SellerOfferHardwareFields({
  register,
  errors,
}: SellerOfferHardwareFieldsProps) {
  const { t } = useTranslation();
  const tError = (message?: string) => (message ? t(message) : undefined);

  const manufacturerError = tError(errors.hardwareManufacturer?.message);
  const modelError = tError(errors.hardwareModel?.message);
  const conditionError = tError(errors.hardwareCondition?.message);
  const warrantyError = tError(errors.hardwareWarranty?.message);
  const serializationError = tError(errors.hardwareSerialization?.message);

  return (
    <OfferCategoryPanel
      id="offer-hardware-title"
      title={t("SellerOfferCreate.hardware.title")}
      tone={TONE}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px">
        <OfferPanelField
          id="offer-hardware-manufacturer"
          label={t("SellerOfferCreate.hardware.manufacturerLabel")}
          required
          error={manufacturerError}
        >
          <Input
            id="offer-hardware-manufacturer"
            {...register("hardwareManufacturer")}
            maxLength={OFFER_HARDWARE_TEXT_MAX}
            placeholder={t(
              "SellerOfferCreate.hardware.manufacturerPlaceholder",
            )}
            aria-invalid={!!manufacturerError}
            aria-describedby={offerPanelDescribedBy(
              "offer-hardware-manufacturer",
              manufacturerError,
            )}
            {...offerPanelControlStyles(TONE, manufacturerError)}
          />
        </OfferPanelField>

        <OfferPanelField
          id="offer-hardware-model"
          label={t("SellerOfferCreate.hardware.modelLabel")}
          required
          error={modelError}
        >
          <Input
            id="offer-hardware-model"
            {...register("hardwareModel")}
            maxLength={OFFER_HARDWARE_TEXT_MAX}
            placeholder={t("SellerOfferCreate.hardware.modelPlaceholder")}
            aria-invalid={!!modelError}
            aria-describedby={offerPanelDescribedBy(
              "offer-hardware-model",
              modelError,
            )}
            {...offerPanelControlStyles(TONE, modelError)}
          />
        </OfferPanelField>

        <OfferPanelField
          id="offer-hardware-condition"
          label={t("SellerOfferCreate.hardware.conditionLabel")}
          required
          error={conditionError}
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              id="offer-hardware-condition"
              {...register("hardwareCondition")}
              aria-invalid={!!conditionError}
              aria-describedby={offerPanelDescribedBy(
                "offer-hardware-condition",
                conditionError,
              )}
              {...offerPanelControlStyles(TONE, conditionError)}
              pe="32px"
            >
              <option value="">
                {t("SellerOfferCreate.hardware.conditionPlaceholder")}
              </option>
              {HARDWARE_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {t(`SellerOfferCreate.hardware.conditions.${condition}`)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#98A6B3" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
        </OfferPanelField>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
        <OfferPanelField
          id="offer-hardware-warranty"
          label={t("SellerOfferCreate.hardware.warrantyLabel")}
          error={warrantyError}
        >
          <Input
            id="offer-hardware-warranty"
            {...register("hardwareWarranty")}
            maxLength={OFFER_HARDWARE_TEXT_MAX}
            placeholder={t("SellerOfferCreate.hardware.warrantyPlaceholder")}
            aria-invalid={!!warrantyError}
            aria-describedby={offerPanelDescribedBy(
              "offer-hardware-warranty",
              warrantyError,
            )}
            {...offerPanelControlStyles(TONE, warrantyError)}
          />
        </OfferPanelField>

        <OfferPanelField
          id="offer-hardware-serialization"
          label={t("SellerOfferCreate.hardware.serializationLabel")}
          error={serializationError}
        >
          <Input
            id="offer-hardware-serialization"
            {...register("hardwareSerialization")}
            maxLength={OFFER_HARDWARE_TEXT_MAX}
            placeholder={t(
              "SellerOfferCreate.hardware.serializationPlaceholder",
            )}
            aria-invalid={!!serializationError}
            aria-describedby={offerPanelDescribedBy(
              "offer-hardware-serialization",
              serializationError,
            )}
            {...offerPanelControlStyles(TONE, serializationError)}
          />
        </OfferPanelField>
      </SimpleGrid>
    </OfferCategoryPanel>
  );
}
