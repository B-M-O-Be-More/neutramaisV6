"use client";

import {
  Flex,
  Icon,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuZap } from "react-icons/lu";

import OfferFormField, {
  OFFER_INPUT_STYLES,
  offerFieldDescribedBy,
} from "@/components/OfferFormField";
import OfferMaskedInput, { MONEY_MASK } from "@/components/OfferMaskedInput";
import { todayIso } from "@/functions/todayIso";
import {
  OFFER_CANCELLATION_TERMS_MAX,
  OFFER_CURRENCIES,
  OFFER_PRICING_MODELS,
} from "@/schemas/sellerOffer";

import { SellerOfferPricingStepProps } from "./interface";

/** Símbolo da moeda no idioma da tela ("R$", "US$"). */
function symbolOf(currency: string, language: string | undefined): string {
  const locale = !language || language.startsWith("pt") ? "pt-BR" : language;
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

/**
 * Etapa 4 da criação de oferta (Figma 2073-50238): modelo de preço, moeda,
 * preço, setup, estoque, cancelamento, vigência e patrocínio.
 */
export function SellerOfferPricingStep({
  control,
  register,
  errors,
}: SellerOfferPricingStepProps) {
  const { t, i18n } = useTranslation();
  const currency = useWatch({ control, name: "currency" }) ?? "BRL";
  const currencySymbol = symbolOf(currency, i18n.language);

  const tError = (message?: string) => (message ? t(message) : undefined);
  const pricingModelError = tError(errors.pricingModel?.message);
  const priceError = tError(errors.price?.message);
  const setupError = tError(errors.setupFee?.message);
  const stockError = tError(errors.stock?.message);
  const cancellationError = tError(errors.cancellationTerms?.message);
  const validUntilError = tError(errors.validUntil?.message);
  const currencyHelper = t("SellerOfferCreate.pricing.currencyHelper");
  const validUntilHelper = t("SellerOfferCreate.pricing.validUntilHelper");

  const border = (error?: string) => (error ? "#EF4444" : "#E5E8EE");
  const selectStyles = {
    h: "47px",
    ps: "13px",
    pe: "36px",
    bg: "#F8F9FB",
    borderWidth: "1px",
    rounded: "14px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#5A6478",
    focusRingColor: "#8B5CF6",
  } as const;

  return (
    <Stack gap="24px">
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
        <OfferFormField
          id="offer-pricing-model"
          label={t("SellerOfferCreate.pricing.pricingModelLabel")}
          required
          error={pricingModelError}
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              id="offer-pricing-model"
              {...register("pricingModel")}
              aria-invalid={!!pricingModelError}
              aria-describedby={offerFieldDescribedBy("offer-pricing-model", {
                error: pricingModelError,
              })}
              borderColor={border(pricingModelError)}
              {...selectStyles}
            >
              <option value="">
                {t("SellerOfferCreate.pricing.pricingModelPlaceholder")}
              </option>
              {OFFER_PRICING_MODELS.map((model) => (
                <option key={model} value={model}>
                  {t(`SellerOfferCreate.pricing.pricingModels.${model}`)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#98A6B3" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
        </OfferFormField>

        <OfferFormField
          id="offer-currency"
          label={t("SellerOfferCreate.pricing.currencyLabel")}
          required
        >
          <NativeSelect.Root>
            <NativeSelect.Field
              id="offer-currency"
              {...register("currency")}
              aria-describedby="offer-currency-warning"
              borderColor="#E5E8EE"
              {...selectStyles}
            >
              {OFFER_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {t(`SellerOfferCreate.pricing.currencies.${code}`)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator>
              <LuChevronDown color="#98A6B3" />
            </NativeSelect.Indicator>
          </NativeSelect.Root>
          <Text
            id="offer-currency-warning"
            pt="4px"
            color="#EF4444"
            fontSize="11px"
            lineHeight="16.5px"
          >
            {currencyHelper}
          </Text>
        </OfferFormField>

        <OfferFormField
          id="offer-price"
          label={t("SellerOfferCreate.pricing.priceLabel", { currency })}
          required
          error={priceError}
        >
          <InputGroup
            startElement={
              <Text
                color="#98A6B3"
                fontSize="14px"
                fontWeight={500}
                aria-hidden="true"
              >
                {currencySymbol}
              </Text>
            }
            startElementProps={{ ps: "13px" }}
          >
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <OfferMaskedInput
                  id="offer-price"
                  ref={field.ref}
                  name={field.name}
                  maskOptions={MONEY_MASK}
                  value={field.value ?? ""}
                  onAccept={field.onChange}
                  onBlur={field.onBlur}
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-invalid={!!priceError}
                  aria-describedby={offerFieldDescribedBy("offer-price", {
                    error: priceError,
                  })}
                  h="47px"
                  fontSize="14px"
                  borderColor={border(priceError)}
                  {...OFFER_INPUT_STYLES}
                  ps={currencySymbol.length > 2 ? "48px" : "40px"}
                />
              )}
            />
          </InputGroup>
        </OfferFormField>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} columnGap="16px" rowGap="24px">
        <OfferFormField
          id="offer-setup-fee"
          label={t("SellerOfferCreate.pricing.setupLabel")}
          error={setupError}
        >
          <Input
            id="offer-setup-fee"
            {...register("setupFee")}
            inputMode="decimal"
            placeholder={t("SellerOfferCreate.pricing.setupPlaceholder")}
            aria-invalid={!!setupError}
            aria-describedby={offerFieldDescribedBy("offer-setup-fee", {
              error: setupError,
            })}
            h="47px"
            fontSize="14px"
            borderColor={border(setupError)}
            {...OFFER_INPUT_STYLES}
          />
        </OfferFormField>

        <OfferFormField
          id="offer-stock"
          label={t("SellerOfferCreate.pricing.stockLabel")}
          error={stockError}
        >
          <Input
            id="offer-stock"
            {...register("stock")}
            inputMode="numeric"
            placeholder={t("SellerOfferCreate.pricing.stockPlaceholder")}
            aria-invalid={!!stockError}
            aria-describedby={offerFieldDescribedBy("offer-stock", {
              error: stockError,
            })}
            h="47px"
            fontSize="14px"
            borderColor={border(stockError)}
            {...OFFER_INPUT_STYLES}
          />
        </OfferFormField>

        <Flex direction="column" gridColumn={{ md: "1 / -1" }}>
          <OfferFormField
            id="offer-cancellation"
            label={t("SellerOfferCreate.pricing.cancellationLabel")}
            required
            error={cancellationError}
          >
            <Input
              id="offer-cancellation"
              {...register("cancellationTerms")}
              maxLength={OFFER_CANCELLATION_TERMS_MAX}
              placeholder={t(
                "SellerOfferCreate.pricing.cancellationPlaceholder",
              )}
              aria-invalid={!!cancellationError}
              aria-describedby={offerFieldDescribedBy("offer-cancellation", {
                error: cancellationError,
              })}
              h="47px"
              fontSize="14px"
              borderColor={border(cancellationError)}
              {...OFFER_INPUT_STYLES}
            />
          </OfferFormField>
        </Flex>

        <OfferFormField
          id="offer-valid-until"
          label={t("SellerOfferCreate.pricing.validUntilLabel")}
          error={validUntilError}
          helper={validUntilHelper}
        >
          <Input
            id="offer-valid-until"
            type="date"
            {...register("validUntil")}
            min={todayIso()}
            aria-invalid={!!validUntilError}
            aria-describedby={offerFieldDescribedBy("offer-valid-until", {
              error: validUntilError,
              helper: validUntilHelper,
            })}
            h="47px"
            fontSize="14px"
            borderColor={border(validUntilError)}
            {...OFFER_INPUT_STYLES}
          />
        </OfferFormField>
      </SimpleGrid>

      <Controller
        control={control}
        name="sponsored"
        render={({ field }) => (
          <Switch.Root
            checked={!!field.value}
            onCheckedChange={(details) => field.onChange(details.checked)}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="16px"
            p="21px"
            borderWidth="1px"
            borderColor={field.value ? "#D3BFFD" : "#E5E8EE"}
            bg={field.value ? "#FAF8FF" : "white"}
            rounded="14px"
            cursor="pointer"
            colorPalette="purple"
          >
            <Switch.HiddenInput onBlur={field.onBlur} />
            <Switch.Label flex="1" minW={0} cursor="pointer">
              <Flex align="flex-start" gap="12px">
                <Flex
                  align="center"
                  justify="center"
                  boxSize="36px"
                  flexShrink={0}
                  bg="#FFFBEB"
                  borderWidth="1px"
                  borderColor="#FDE68A"
                  rounded="10px"
                >
                  <Icon as={LuZap} boxSize="16px" color="#D97706" />
                </Flex>
                <Stack gap={0} minW={0}>
                  <Text
                    color="#0F1729"
                    fontSize="14px"
                    fontWeight={700}
                    lineHeight="21px"
                  >
                    {t("SellerOfferCreate.pricing.sponsoredLabel")}
                  </Text>
                  <Text
                    color="#8A9AB5"
                    fontSize="12px"
                    fontWeight={400}
                    lineHeight="18px"
                  >
                    {t("SellerOfferCreate.pricing.sponsoredDescription")}
                  </Text>
                </Stack>
              </Flex>
            </Switch.Label>
            <Switch.Control
              flexShrink={0}
              w="38px"
              h="22px"
              bg={field.value ? "#8B5CF6" : "#E5E8EE"}
            >
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        )}
      />
    </Stack>
  );
}
