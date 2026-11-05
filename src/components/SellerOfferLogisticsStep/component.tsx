"use client";

import {
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  RadioGroup,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import type { FactoryOpts } from "imask";
import React from "react";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCheck,
  LuContainer,
  LuHandshake,
  LuInfo,
  LuMapPin,
  LuPackage,
  LuTruck,
  LuZap,
} from "react-icons/lu";

import { offerFieldDescribedBy } from "@/components/OfferFormField";
import OfferMaskedInput, {
  DIGITS_MASK,
  MONEY_MASK,
  POSTAL_CODE_MASK,
  SIDE_CM_MASK,
  WEIGHT_G_MASK,
} from "@/components/OfferMaskedInput";
import { nearestCapital } from "@/data/postalCodeCapitals";
import {
  packagePreset,
  SHIPPING_PACKAGE_SIZES,
  type ShippingPackageSize,
} from "@/data/shippingPackagePresets";
import { parseDecimal } from "@/functions/parseDecimal";
import {
  exceedsMarketLimits,
  gramsToKgText,
  kgToGramsText,
} from "@/functions/shippingPackage";
import {
  OFFER_ON_DEMAND_MAX_DAYS,
  OFFER_ON_DEMAND_MIN_DAYS,
  OFFER_PICKUP_TEXT_MAX,
  OFFER_SHIPPING_DISPATCH_TIMES,
  shippingModesFor,
  type OfferShippingDispatchTime,
  type OfferShippingMode,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";

import { SellerOfferLogisticsStepProps } from "./interface";

const ACCENT = "#8B5CF6";
const SELECTED_BG = "#F3EEFF";
const BORDER = "#E5E8EE";
const MUTED = "#8A9AB5";
const LABEL = "#5A6478";

/** Campos da etapa (Figma 2943-33503): cinza, raio 12, texto 13 semibold. */
const INPUT_STYLES = {
  h: "45px",
  px: "12px",
  bg: "#F8F9FB",
  borderWidth: "1px",
  rounded: "12px",
  color: "#0F1729",
  fontSize: "13px",
  fontWeight: 600,
  focusRingColor: ACCENT,
  _placeholder: { color: "rgba(90,100,120,0.5)" },
  _disabled: { opacity: 0.6, cursor: "not-allowed" },
} as const;

/** Espaço do "R$" à esquerda dos campos de dinheiro. */
const CURRENCY_PADDING = "36px";

type SideField = Extract<
  keyof SellerOfferValues,
  "shippingHeightCm" | "shippingWidthCm" | "shippingLengthCm"
>;

const SIDES: {
  name: SideField;
  id: string;
  labelKey: string;
  preset: "heightCm" | "widthCm" | "lengthCm";
}[] = [
  {
    name: "shippingHeightCm",
    id: "offer-shipping-height",
    labelKey: "heightLabel",
    preset: "heightCm",
  },
  {
    name: "shippingWidthCm",
    id: "offer-shipping-width",
    labelKey: "widthLabel",
    preset: "widthCm",
  },
  {
    name: "shippingLengthCm",
    id: "offer-shipping-length",
    labelKey: "lengthLabel",
    preset: "lengthCm",
  },
];

const MODE_ICONS: Record<OfferShippingMode, IconType> = {
  integration: LuTruck,
  freeShipping: LuPackage,
  pickup: LuMapPin,
  cargo: LuContainer,
  toBeAgreed: LuHandshake,
};

/** Prazo recomendado (selo verde) — também o padrão do formulário. */
const RECOMMENDED_DISPATCH: OfferShippingDispatchTime = "oneDay";

/**
 * Cotações de exemplo da simulação. A marketplace-api ainda não tem o
 * simulador do seller (a cotação é do buyer e não aceita a própria
 * organização), então o seller vê valores ilustrativos; o frete real é
 * cotado no produto e no checkout.
 */
const SIMULATION_EXAMPLES = [
  { carrier: "Jadlog Package", price: 28.4, days: 3 },
  { carrier: "Correios PAC", price: 31.9, days: 5 },
  { carrier: "Azul Cargo", price: 46.7, days: 2 },
];
const CHEAPEST = Math.min(...SIMULATION_EXAMPLES.map((item) => item.price));

/** Título de seção da etapa, com ícone e complemento à direita opcionais. */
function SectionTitle({
  id,
  icon,
  title,
  caption,
}: {
  id: string;
  icon?: IconType;
  title: string;
  caption?: string;
}) {
  return (
    <Flex align="center" justify="space-between" gap="12px" pb="12px">
      <Flex align="center" gap="8px" minW={0}>
        {icon && <Icon as={icon} boxSize="15px" color={ACCENT} />}
        <Text
          id={id}
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {title}
        </Text>
      </Flex>
      {caption && (
        <Text color={MUTED} fontSize="10px" lineHeight="15px" flexShrink={0}>
          {caption}
        </Text>
      )}
    </Flex>
  );
}

/**
 * Rótulo, campo, erro e ajuda no formato da etapa: rótulo pequeno em cinza
 * (11px; 12px no acréscimo do frete), sem asterisco.
 */
function LogisticsField({
  id,
  label,
  labelSize = "11px",
  error,
  helper,
  children,
}: {
  id: string;
  label: string;
  labelSize?: "11px" | "12px";
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={0} minW={0}>
      <Text
        asChild
        pb="6px"
        color={LABEL}
        fontSize={labelSize}
        fontWeight={600}
        lineHeight={labelSize === "11px" ? "16.5px" : "18px"}
      >
        <label htmlFor={id}>{label}</label>
      </Text>
      {children}
      {error && (
        <Text
          id={`${id}-error`}
          pt="4px"
          color="#EF4444"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {error}
        </Text>
      )}
      {helper && (
        <Text
          id={`${id}-helper`}
          pt="4px"
          color={MUTED}
          fontSize="11px"
          lineHeight="16.5px"
          aria-live="polite"
        >
          {helper}
        </Text>
      )}
    </Stack>
  );
}

/** Aviso cinza com ícone (retirada, frete a combinar, limite de mercado). */
function Note({ icon, children }: { icon: IconType; children: string }) {
  return (
    <Flex
      gap="10px"
      p="16px"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor={BORDER}
      rounded="12px"
    >
      <Icon as={icon} boxSize="15px" mt="2px" color={LABEL} />
      <Text color={LABEL} fontSize="12px" lineHeight="18px">
        {children}
      </Text>
    </Flex>
  );
}

type MaskedFieldName = Extract<
  keyof SellerOfferValues,
  | "shippingOriginPostalCode"
  | "shippingInsuranceValue"
  | "shippingOnDemandDays"
  | "shippingExtraFee"
  | "shippingCargoPrice"
  | "shippingCargoDays"
  | SideField
>;

/**
 * Etapa Logística da oferta — só em produto físico (Hardware / CPE), Figma
 * 2943-33503 e RN-LOG-01: origem, tempo para postagem, tamanho e medidas da
 * embalagem, modalidade de frete, acréscimo, rastreio e uma simulação.
 *
 * Origem, prazo, tamanho, peso e medidas vão em `shipping`; o resto, em
 * `metadata.shippingPolicy`. O peso é digitado em gramas e guardado em kg.
 * A origem é só o CEP: ainda não há cadastro de endereços do seller para o
 * seletor do Figma. Acima do limite de mercado (30 kg, 100 cm em um lado,
 * 200 cm na soma) as modalidades viram frete de carga ou frete a combinar.
 */
export function SellerOfferLogisticsStep({
  control,
  errors,
  setValue,
  locale,
}: SellerOfferLogisticsStepProps) {
  const { t } = useTranslation();
  const [
    weightKg,
    heightCm,
    widthCm,
    lengthCm,
    dispatch,
    mode,
    originPostalCode,
    extraFee,
  ] = useWatch({
    control,
    name: [
      "shippingWeightKg",
      "shippingHeightCm",
      "shippingWidthCm",
      "shippingLengthCm",
      "shippingDispatch",
      "shippingMode",
      "shippingOriginPostalCode",
      "shippingExtraFee",
    ],
  });

  // A modalidade acompanha o pacote: fora do limite, carga ou a combinar.
  const exceedsLimits = exceedsMarketLimits({
    weightKg,
    heightCm,
    widthCm,
    lengthCm,
  });
  const modes = shippingModesFor(exceedsLimits);
  React.useEffect(() => {
    if (mode && !modes.includes(mode)) {
      setValue("shippingMode", modes[0], { shouldDirty: true });
    }
  }, [mode, modes, setValue]);

  // Pequeno, Médio e Grande preenchem medidas e peso; Carga e Personalizado
  // levam ao primeiro campo para o seller digitar.
  const choosePackageSize = (size: ShippingPackageSize) => {
    setValue("shippingPackageSize", size, { shouldDirty: true });
    const preset = packagePreset(size);
    if (!preset) {
      document.getElementById(SIDES[0].id)?.focus();
      return;
    }
    for (const side of SIDES) {
      setValue(side.name, String(preset[side.preset]), { shouldDirty: true });
    }
    setValue("shippingWeightKg", gramsToKgText(String(preset.weightG)), {
      shouldDirty: true,
    });
  };

  const tError = (message?: string) => (message ? t(message) : undefined);
  const border = (error?: string) => (error ? "#EF4444" : BORDER);

  const hasCarrierQuote = mode === "integration" || mode === "cargo";
  const capital = nearestCapital(originPostalCode ?? "");
  const fee = hasCarrierQuote ? (parseDecimal(extraFee) ?? 0) : 0;
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const currencyAddon = (
    <Text color={MUTED} fontSize="12px" fontWeight={600} aria-hidden="true">
      R$
    </Text>
  );

  /** Campo com máscara da etapa (rótulo, erro, ajuda e "R$"). */
  const maskedField = ({
    name,
    id,
    label,
    labelSize,
    mask,
    placeholder,
    helper,
    currency = false,
    disabled = false,
    inputMode = "decimal",
  }: {
    name: MaskedFieldName;
    id: string;
    label: string;
    labelSize?: "11px" | "12px";
    mask: FactoryOpts;
    placeholder: string;
    helper?: string;
    currency?: boolean;
    disabled?: boolean;
    inputMode?: "decimal" | "numeric";
  }) => {
    const error = tError(errors[name]?.message);
    const input = (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <OfferMaskedInput
            id={id}
            ref={field.ref}
            name={field.name}
            maskOptions={mask}
            value={field.value ?? ""}
            onAccept={field.onChange}
            onBlur={field.onBlur}
            inputMode={inputMode}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={offerFieldDescribedBy(id, { error, helper })}
            borderColor={border(error)}
            {...INPUT_STYLES}
            {...(currency ? { ps: CURRENCY_PADDING } : {})}
          />
        )}
      />
    );
    return (
      <LogisticsField
        key={id}
        id={id}
        label={label}
        labelSize={labelSize}
        error={error}
        helper={helper}
      >
        {currency ? (
          <InputGroup
            startElement={currencyAddon}
            startElementProps={{ ps: "12px" }}
          >
            {input}
          </InputGroup>
        ) : (
          input
        )}
      </LogisticsField>
    );
  };

  const weightError = tError(errors.shippingWeightKg?.message);
  const packageSizeError = tError(errors.shippingPackageSize?.message);
  const modeError = tError(errors.shippingMode?.message);

  return (
    <Stack gap="24px">
      {/* Regras de logística */}
      <Flex
        gap="12px"
        px="20px"
        py="16px"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="12px"
      >
        <Icon as={LuTruck} boxSize="15px" mt="2px" color="#1F5AFF" />
        <Stack gap="2px">
          <Text
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerOfferCreate.logistics.rulesTitle")}
          </Text>
          <Text color="#5A7CE0" fontSize="12px" lineHeight="18px">
            {t("SellerOfferCreate.logistics.rulesText")}
          </Text>
        </Stack>
      </Flex>

      {/* Endereço de origem */}
      <Box as="section" aria-labelledby="offer-logistics-origin">
        <SectionTitle
          id="offer-logistics-origin"
          icon={LuMapPin}
          title={t("SellerOfferCreate.logistics.originTitle")}
        />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="12px">
          {maskedField({
            name: "shippingOriginPostalCode",
            id: "offer-shipping-postal-code",
            label: t("SellerOfferCreate.shipping.postalCodeLabel"),
            mask: POSTAL_CODE_MASK,
            placeholder: "60150-161",
            inputMode: "numeric",
            helper: capital
              ? t("SellerOfferCreate.logistics.originCapital", { capital })
              : undefined,
          })}
          {maskedField({
            name: "shippingInsuranceValue",
            id: "offer-shipping-insurance",
            label: t("SellerOfferCreate.shipping.insuranceLabel"),
            mask: MONEY_MASK,
            placeholder: "0,00",
            currency: true,
            helper: t("SellerOfferCreate.logistics.insuranceHelper"),
          })}
        </SimpleGrid>
      </Box>

      {/* Tempo para postagem */}
      <Stack gap="12px">
        <Controller
          control={control}
          name="shippingDispatch"
          render={({ field }) => (
            <RadioGroup.Root
              value={field.value}
              onValueChange={(details) => field.onChange(details.value)}
              aria-labelledby="offer-logistics-dispatch"
            >
              <SectionTitle
                id="offer-logistics-dispatch"
                title={t("SellerOfferCreate.logistics.dispatchTitle")}
              />
              <SimpleGrid columns={{ base: 2, md: 5 }} gap="8px">
                {OFFER_SHIPPING_DISPATCH_TIMES.map((option) => {
                  const selected = option === field.value;
                  return (
                    <RadioGroup.Item
                      key={option}
                      value={option}
                      position="relative"
                      justifyContent="center"
                      minH="64px"
                      p="12px"
                      bg={selected ? SELECTED_BG : "white"}
                      borderWidth="2px"
                      borderColor={selected ? ACCENT : BORDER}
                      rounded="12px"
                      cursor="pointer"
                      textAlign="center"
                    >
                      <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                      <RadioGroup.ItemText
                        color={selected ? ACCENT : LABEL}
                        fontSize="12px"
                        fontWeight={600}
                        lineHeight="18px"
                      >
                        {t(`SellerOfferCreate.logistics.dispatch.${option}`)}
                      </RadioGroup.ItemText>
                      {/* Selo sobre a borda do card. */}
                      {option === RECOMMENDED_DISPATCH && (
                        <Text
                          position="absolute"
                          top="-8px"
                          left="16px"
                          px="8px"
                          py="2px"
                          bg="#10B981"
                          color="white"
                          fontSize="8px"
                          fontWeight={700}
                          lineHeight="12px"
                          rounded="full"
                          whiteSpace="nowrap"
                        >
                          {t("SellerOfferCreate.logistics.recommended")}
                        </Text>
                      )}
                    </RadioGroup.Item>
                  );
                })}
              </SimpleGrid>
            </RadioGroup.Root>
          )}
        />
        {dispatch === "onDemand" && (
          <Box maxW={{ md: "50%" }}>
            {maskedField({
              name: "shippingOnDemandDays",
              id: "offer-shipping-on-demand-days",
              label: t("SellerOfferCreate.logistics.onDemandDaysLabel"),
              mask: DIGITS_MASK,
              placeholder: "10",
              inputMode: "numeric",
              helper: t("SellerOfferCreate.logistics.onDemandDaysHelper", {
                min: OFFER_ON_DEMAND_MIN_DAYS,
                max: OFFER_ON_DEMAND_MAX_DAYS,
              }),
            })}
          </Box>
        )}
      </Stack>

      {/* Embalagem e peso */}
      <Box as="section" aria-labelledby="offer-logistics-package">
        <SectionTitle
          id="offer-logistics-package"
          title={t("SellerOfferCreate.logistics.packageTitle")}
          caption={t("SellerOfferCreate.logistics.packageCaption")}
        />
        <Controller
          control={control}
          name="shippingPackageSize"
          render={({ field }) => (
            <RadioGroup.Root
              value={field.value}
              onValueChange={(details) =>
                details.value &&
                choosePackageSize(details.value as ShippingPackageSize)
              }
              aria-label={t("SellerOfferCreate.logistics.presetsLabel")}
              aria-describedby="offer-shipping-package-hint"
            >
              <Flex wrap="wrap" gap="8px">
                {SHIPPING_PACKAGE_SIZES.map((size) => {
                  const selected = size === field.value;
                  return (
                    <RadioGroup.Item
                      key={size}
                      value={size}
                      flex="1 0 auto"
                      justifyContent="center"
                      h="34px"
                      px="12px"
                      bg={selected ? SELECTED_BG : "white"}
                      borderWidth="1px"
                      borderColor={selected ? ACCENT : BORDER}
                      rounded="8px"
                      cursor="pointer"
                    >
                      <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                      <RadioGroup.ItemText
                        color={selected ? ACCENT : LABEL}
                        fontSize="11px"
                        fontWeight={600}
                        lineHeight="16.5px"
                      >
                        {t(`SellerOfferCreate.logistics.presets.${size}`)}
                      </RadioGroup.ItemText>
                    </RadioGroup.Item>
                  );
                })}
              </Flex>
              <Text
                id="offer-shipping-package-hint"
                pt="8px"
                color={MUTED}
                fontSize="10px"
                lineHeight="15px"
              >
                {t(`SellerOfferCreate.logistics.presetHints.${field.value}`)}
              </Text>
              {packageSizeError && (
                <Text
                  pt="4px"
                  color="#EF4444"
                  fontSize="11px"
                  lineHeight="16.5px"
                  role="alert"
                >
                  {packageSizeError}
                </Text>
              )}
            </RadioGroup.Root>
          )}
        />

        <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px" pt="16px">
          {SIDES.map((side) =>
            maskedField({
              name: side.name,
              id: side.id,
              label: t(`SellerOfferCreate.shipping.${side.labelKey}`),
              mask: SIDE_CM_MASK,
              placeholder: "20",
            }),
          )}

          {/* Peso em gramas na tela, em kg no formulário. */}
          <LogisticsField
            id="offer-shipping-weight"
            label={t("SellerOfferCreate.shipping.weightLabel")}
            error={weightError}
          >
            <Controller
              control={control}
              name="shippingWeightKg"
              render={({ field }) => (
                <OfferMaskedInput
                  id="offer-shipping-weight"
                  ref={field.ref}
                  name={field.name}
                  maskOptions={WEIGHT_G_MASK}
                  value={kgToGramsText(field.value)}
                  onAccept={(grams) => field.onChange(gramsToKgText(grams))}
                  onBlur={field.onBlur}
                  inputMode="numeric"
                  placeholder="3000"
                  aria-invalid={!!weightError}
                  aria-describedby={offerFieldDescribedBy(
                    "offer-shipping-weight",
                    { error: weightError },
                  )}
                  borderColor={border(weightError)}
                  {...INPUT_STYLES}
                />
              )}
            />
          </LogisticsField>
        </SimpleGrid>
      </Box>

      {/* Modalidade de frete */}
      <Stack gap="12px">
        <Controller
          control={control}
          name="shippingMode"
          render={({ field }) => (
            <RadioGroup.Root
              value={field.value}
              onValueChange={(details) => field.onChange(details.value)}
              aria-labelledby="offer-logistics-mode"
            >
              <SectionTitle
                id="offer-logistics-mode"
                title={t("SellerOfferCreate.logistics.modeTitle")}
              />
              <SimpleGrid columns={{ base: 1, md: modes.length }} gap="12px">
                {modes.map((option) => {
                  const selected = option === field.value;
                  return (
                    <RadioGroup.Item
                      key={option}
                      value={option}
                      alignItems="flex-start"
                      gap="12px"
                      p="16px"
                      bg={selected ? SELECTED_BG : "white"}
                      borderWidth="2px"
                      borderColor={selected ? ACCENT : BORDER}
                      rounded="12px"
                      cursor="pointer"
                    >
                      <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                      <Icon
                        as={MODE_ICONS[option]}
                        boxSize="16px"
                        flexShrink={0}
                        color={selected ? ACCENT : MUTED}
                      />
                      <Stack gap="4px" minW={0}>
                        <RadioGroup.ItemText
                          color="#0F1729"
                          fontSize="12px"
                          fontWeight={700}
                          lineHeight="18px"
                        >
                          {t(
                            `SellerOfferCreate.logistics.modes.${option}.title`,
                          )}
                        </RadioGroup.ItemText>
                        <Text color={MUTED} fontSize="10px" lineHeight="15px">
                          {t(
                            `SellerOfferCreate.logistics.modes.${option}.description`,
                          )}
                        </Text>
                      </Stack>
                    </RadioGroup.Item>
                  );
                })}
              </SimpleGrid>
            </RadioGroup.Root>
          )}
        />
        {exceedsLimits && (
          <Note icon={LuInfo}>
            {t("SellerOfferCreate.logistics.outOfLimitNote")}
          </Note>
        )}
        {modeError && (
          <Text
            color="#EF4444"
            fontSize="11px"
            lineHeight="16.5px"
            role="alert"
          >
            {modeError}
          </Text>
        )}
      </Stack>

      {/* Frete de carga: valor e prazo do seller, quando a integração não cota */}
      {mode === "cargo" && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
          {maskedField({
            name: "shippingCargoPrice",
            id: "offer-shipping-cargo-price",
            label: t("SellerOfferCreate.logistics.cargoPriceLabel"),
            labelSize: "12px",
            mask: MONEY_MASK,
            placeholder: "0,00",
            currency: true,
            helper: t("SellerOfferCreate.logistics.cargoHelper"),
          })}
          {maskedField({
            name: "shippingCargoDays",
            id: "offer-shipping-cargo-days",
            label: t("SellerOfferCreate.logistics.cargoDaysLabel"),
            labelSize: "12px",
            mask: DIGITS_MASK,
            placeholder: "8",
            inputMode: "numeric",
          })}
        </SimpleGrid>
      )}

      {/* Retirada no local: endereço e horário */}
      {mode === "pickup" && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px">
          {(
            [
              [
                "shippingPickupAddress",
                "pickupAddressLabel",
                "Av. Santos Dumont, 3030 · Fortaleza/CE",
              ],
              [
                "shippingPickupHours",
                "pickupHoursLabel",
                "Seg a sex, 8h às 17h",
              ],
            ] as const
          ).map(([name, labelKey, placeholder]) => {
            const id = `offer-${name}`;
            const error = tError(errors[name]?.message);
            return (
              <LogisticsField
                key={name}
                id={id}
                label={t(`SellerOfferCreate.logistics.${labelKey}`)}
                labelSize="12px"
                error={error}
              >
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <Input
                      id={id}
                      {...field}
                      maxLength={OFFER_PICKUP_TEXT_MAX}
                      placeholder={placeholder}
                      aria-invalid={!!error}
                      aria-describedby={offerFieldDescribedBy(id, { error })}
                      borderColor={border(error)}
                      {...INPUT_STYLES}
                    />
                  )}
                />
              </LogisticsField>
            );
          })}
        </SimpleGrid>
      )}

      {/* Acréscimo no frete e rastreio */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="16px" alignItems="end">
        {maskedField({
          name: "shippingExtraFee",
          id: "offer-shipping-extra-fee",
          label: t("SellerOfferCreate.logistics.extraFeeLabel"),
          labelSize: "12px",
          mask: MONEY_MASK,
          placeholder: "0,00",
          currency: true,
          disabled: !hasCarrierQuote,
          helper: hasCarrierQuote
            ? undefined
            : t("SellerOfferCreate.logistics.extraFeeCarrierOnly"),
        })}

        <Controller
          control={control}
          name="shippingAutoTracking"
          render={({ field }) => {
            const on = !!field.value && mode !== "pickup";
            return (
              <Switch.Root
                size="lg"
                checked={on}
                disabled={mode === "pickup"}
                onCheckedChange={(details) => field.onChange(details.checked)}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="16px"
                p="16px"
                bg="white"
                borderWidth="1px"
                borderColor={BORDER}
                rounded="12px"
                cursor="pointer"
                _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                <Switch.HiddenInput onBlur={field.onBlur} />
                <Switch.Label flex="1" minW={0} cursor="inherit">
                  <Text
                    as="span"
                    display="block"
                    color="#0F1729"
                    fontSize="13px"
                    fontWeight={700}
                    lineHeight="19.5px"
                  >
                    {t("SellerOfferCreate.logistics.trackingTitle")}
                  </Text>
                  <Text
                    as="span"
                    display="block"
                    pt="4px"
                    color={MUTED}
                    fontSize="10px"
                    fontWeight={400}
                    lineHeight="15px"
                  >
                    {t("SellerOfferCreate.logistics.trackingDescription")}
                  </Text>
                </Switch.Label>
                <Switch.Control flexShrink={0} bg={on ? "#10B981" : BORDER}>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            );
          }}
        />
      </SimpleGrid>

      {/* Simulação de frete */}
      {mode === "pickup" ? (
        <Note icon={LuMapPin}>
          {t("SellerOfferCreate.logistics.pickupNote")}
        </Note>
      ) : mode === "toBeAgreed" ? (
        <Note icon={LuHandshake}>
          {t("SellerOfferCreate.logistics.toBeAgreedNote")}
        </Note>
      ) : (
        <Box
          as="section"
          aria-labelledby="offer-logistics-simulation"
          p="20px"
          bg="#EDFBF5"
          borderWidth="1px"
          borderColor="#AAECD5"
          rounded="12px"
        >
          <Flex align="center" gap="8px">
            <Icon as={LuZap} boxSize="15px" color="#087C58" />
            <Text
              id="offer-logistics-simulation"
              color="#087C58"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {capital
                ? t("SellerOfferCreate.logistics.simulationTitle", { capital })
                : t("SellerOfferCreate.logistics.simulationTitlePending")}
            </Text>
          </Flex>

          {capital ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="12px" pt="16px">
              {SIMULATION_EXAMPLES.map((item) => (
                <Stack
                  key={item.carrier}
                  gap={0}
                  p="12px"
                  bg="white"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                  rounded="8px"
                >
                  <Flex align="center" justify="space-between" gap="8px">
                    <Text
                      color="#0F1729"
                      fontSize="11px"
                      fontWeight={700}
                      lineHeight="16.5px"
                    >
                      {item.carrier}
                    </Text>
                    {item.price === CHEAPEST && (
                      <Icon
                        as={LuCheck}
                        boxSize="12px"
                        color="#10B981"
                        aria-label={t("SellerOfferCreate.logistics.cheapest")}
                      />
                    )}
                  </Flex>
                  <Text
                    pt="8px"
                    color="#087C58"
                    fontSize="14px"
                    fontWeight={800}
                    lineHeight="21px"
                  >
                    {money(item.price + fee)}
                  </Text>
                  <Text color={MUTED} fontSize="10px" lineHeight="15px">
                    {t("SellerOfferCreate.logistics.businessDays", {
                      count: item.days,
                    })}
                  </Text>
                </Stack>
              ))}
            </SimpleGrid>
          ) : (
            <Text pt="12px" color="#087C58" fontSize="12px" lineHeight="18px">
              {t("SellerOfferCreate.logistics.simulationPending")}
            </Text>
          )}

          <Text pt="12px" color="#5A8C7A" fontSize="10px" lineHeight="15px">
            {t(
              mode === "freeShipping"
                ? "SellerOfferCreate.logistics.simulationFreeShipping"
                : "SellerOfferCreate.logistics.simulationDisclaimer",
            )}
          </Text>
        </Box>
      )}
    </Stack>
  );
}
