"use client";

import {
  Flex,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";

import OfferFormField, {
  OFFER_INPUT_STYLES,
  offerFieldDescribedBy,
} from "@/components/OfferFormField";
import OfferMaskedInput, {
  DIGITS_MASK,
  PERCENT_MASK,
} from "@/components/OfferMaskedInput";
import SellerOfferHardwareFields from "@/components/SellerOfferHardwareFields";
import SellerOfferNumberingFields from "@/components/SellerOfferNumberingFields";
import {
  OFFER_ACCEPTANCE_SLA_MAX,
  OFFER_ACCEPTANCE_SLA_MIN,
  OFFER_DELIVERY_TIME_MAX,
  OFFER_SPEED_UNITS,
} from "@/schemas/sellerOffer";

import { SellerOfferTechnicalSpecsStepProps } from "./interface";

/**
 * Etapa 3 da criação de oferta (Figma 2073-48148): velocidade/banda,
 * latência, SLAs e prazo de ativação.
 * - Velocidade e latência só aceitam dígitos; a velocidade só é obrigatória
 *   para Conectividade.
 * - SLA técnico é um percentual (0–100, vírgula decimal, "%" fixo).
 * - Hardware / CPE ganha o bloco de fabricante, modelo e condição (Figma
 *   2074-56987).
 * - Recursos Numéricos não têm banda nem latência: aparece a documentação
 *   LACNIC/ANATEL no lugar (Figma 2074-59682).
 */
export function SellerOfferTechnicalSpecsStep({
  control,
  register,
  errors,
}: SellerOfferTechnicalSpecsStepProps) {
  const { t } = useTranslation();
  const category = useWatch({ control, name: "category" });
  const speedRequired = category === "connectivity";
  const showNetworkFields = category !== "numberingResources";

  const tError = (message?: string) => (message ? t(message) : undefined);
  const speedError = tError(errors.speedValue?.message);
  const latencyError = tError(errors.maxLatency?.message);
  const acceptanceError = tError(errors.acceptanceSla?.message);
  const technicalError = tError(errors.technicalSla?.message);
  const deliveryError = tError(errors.deliveryTime?.message);
  const acceptanceHelper = t(
    "SellerOfferCreate.technicalSpecs.acceptanceSlaHelper",
    {
      min: OFFER_ACCEPTANCE_SLA_MIN,
      max: OFFER_ACCEPTANCE_SLA_MAX,
    },
  );

  const border = (error?: string) => (error ? "#EF4444" : "#E5E8EE");

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} columnGap="20px" rowGap="20px">
      {showNetworkFields && (
        <OfferFormField
          id="offer-speed"
          label={t("SellerOfferCreate.technicalSpecs.speedLabel")}
          required={speedRequired}
          error={speedError}
        >
          <Flex gap="8px">
            <Controller
              control={control}
              name="speedValue"
              render={({ field }) => (
                <OfferMaskedInput
                  id="offer-speed"
                  ref={field.ref}
                  name={field.name}
                  maskOptions={DIGITS_MASK}
                  value={field.value ?? ""}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  inputMode="numeric"
                  placeholder="500"
                  aria-invalid={!!speedError}
                  aria-describedby={offerFieldDescribedBy("offer-speed", {
                    error: speedError,
                  })}
                  flex="1"
                  minW={0}
                  h="47px"
                  fontSize="14px"
                  borderColor={border(speedError)}
                  {...OFFER_INPUT_STYLES}
                />
              )}
            />
            <NativeSelect.Root w="97px" flexShrink={0}>
              <NativeSelect.Field
                {...register("speedUnit")}
                aria-label={t("SellerOfferCreate.technicalSpecs.speedUnit")}
                h="47px"
                ps="13px"
                pe="32px"
                bg="white"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="14px"
                fontSize="14px"
                fontWeight={500}
                color="#5A6478"
              >
                {OFFER_SPEED_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator>
                <LuChevronDown color="#98A6B3" />
              </NativeSelect.Indicator>
            </NativeSelect.Root>
          </Flex>
        </OfferFormField>
      )}

      {showNetworkFields && (
        <OfferFormField
          id="offer-latency"
          label={t("SellerOfferCreate.technicalSpecs.latencyLabel")}
          error={latencyError}
        >
          <Flex gap="8px">
            <Controller
              control={control}
              name="maxLatency"
              render={({ field }) => (
                <OfferMaskedInput
                  id="offer-latency"
                  ref={field.ref}
                  name={field.name}
                  maskOptions={DIGITS_MASK}
                  value={field.value ?? ""}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  inputMode="numeric"
                  placeholder="5"
                  aria-invalid={!!latencyError}
                  aria-describedby={offerFieldDescribedBy("offer-latency", {
                    error: latencyError,
                  })}
                  flex="1"
                  minW={0}
                  h="47px"
                  fontSize="14px"
                  borderColor={border(latencyError)}
                  {...OFFER_INPUT_STYLES}
                />
              )}
            />
            <Flex
              align="center"
              h="47px"
              px="17px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="14px"
              flexShrink={0}
            >
              <Text color="#5A6478" fontSize="14px" lineHeight="21px">
                ms
              </Text>
            </Flex>
          </Flex>
        </OfferFormField>
      )}

      <OfferFormField
        id="offer-acceptance-sla"
        label={t("SellerOfferCreate.technicalSpecs.acceptanceSlaLabel")}
        labelHint={t("SellerOfferCreate.technicalSpecs.acceptanceSlaHint")}
        required
        error={acceptanceError}
        helper={acceptanceHelper}
      >
        <Input
          id="offer-acceptance-sla"
          {...register("acceptanceSla")}
          type="number"
          inputMode="numeric"
          min={OFFER_ACCEPTANCE_SLA_MIN}
          max={OFFER_ACCEPTANCE_SLA_MAX}
          step={1}
          aria-invalid={!!acceptanceError}
          aria-describedby={offerFieldDescribedBy("offer-acceptance-sla", {
            error: acceptanceError,
            helper: acceptanceHelper,
          })}
          h="47px"
          fontSize="14px"
          borderColor={border(acceptanceError)}
          {...OFFER_INPUT_STYLES}
        />
      </OfferFormField>

      <OfferFormField
        id="offer-technical-sla"
        label={t("SellerOfferCreate.technicalSpecs.technicalSlaLabel")}
        required
        error={technicalError}
      >
        <InputGroup
          endElement={
            <Text color="#5A6478" fontSize="14px" aria-hidden="true">
              %
            </Text>
          }
          endElementProps={{ pe: "17px" }}
        >
          <Controller
            control={control}
            name="technicalSla"
            render={({ field }) => (
              <OfferMaskedInput
                id="offer-technical-sla"
                ref={field.ref}
                name={field.name}
                maskOptions={PERCENT_MASK}
                value={field.value ?? ""}
                onAccept={field.onChange}
                onBlur={field.onBlur}
                inputMode="decimal"
                placeholder="98,5"
                aria-invalid={!!technicalError}
                aria-describedby={offerFieldDescribedBy("offer-technical-sla", {
                  error: technicalError,
                })}
                h="47px"
                fontSize="14px"
                borderColor={border(technicalError)}
                {...OFFER_INPUT_STYLES}
                pe="40px"
              />
            )}
          />
        </InputGroup>
      </OfferFormField>

      <Flex direction="column" gridColumn={{ md: "1 / -1" }}>
        <OfferFormField
          id="offer-delivery-time"
          label={t("SellerOfferCreate.technicalSpecs.deliveryTimeLabel")}
          required
          error={deliveryError}
        >
          <Input
            id="offer-delivery-time"
            {...register("deliveryTime")}
            maxLength={OFFER_DELIVERY_TIME_MAX}
            placeholder={t(
              "SellerOfferCreate.technicalSpecs.deliveryTimePlaceholder",
            )}
            aria-invalid={!!deliveryError}
            aria-describedby={offerFieldDescribedBy("offer-delivery-time", {
              error: deliveryError,
            })}
            h="47px"
            fontSize="14px"
            borderColor={border(deliveryError)}
            {...OFFER_INPUT_STYLES}
          />
        </OfferFormField>
      </Flex>

      {category === "hardware" && (
        <Flex direction="column" gridColumn={{ md: "1 / -1" }}>
          <SellerOfferHardwareFields register={register} errors={errors} />
        </Flex>
      )}

      {category === "numberingResources" && (
        <Flex direction="column" gridColumn={{ md: "1 / -1" }}>
          <SellerOfferNumberingFields register={register} errors={errors} />
        </Flex>
      )}
    </SimpleGrid>
  );
}
