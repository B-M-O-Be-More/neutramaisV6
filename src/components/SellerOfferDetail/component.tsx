"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuDollarSign,
  LuEye,
  LuImage,
  LuInfo,
  LuMapPin,
  LuPackage,
  LuPencil,
  LuPlay,
  LuShield,
  LuShoppingCart,
  LuTrendingUp,
  LuUpload,
  LuZap,
} from "react-icons/lu";

import { offerCategory } from "@/data/offerCategories";
import { OFFERING_STATUS_STYLES } from "@/data/offeringStatus";
import {
  formatHours,
  formatIsoDate,
  formatPercent,
} from "@/functions/offerFormat";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import { parseDecimal } from "@/functions/parseDecimal";

import { SellerOfferDetailProps } from "./interface";

const DASH = "—";

/** "R$ 109,99" — símbolo da moeda, como no design. */
function formatCurrency(
  value: string | number,
  currency: string,
  locale: string,
): string {
  const amount = typeof value === "number" ? value : parseDecimal(value);
  if (amount === null || !Number.isFinite(amount)) return DASH;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amount,
  );
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

/** Título de bloco com ícone ("Especificações Técnicas", "Cobertura / KMZ"). */
function SectionTitle({
  icon,
  color,
  children,
}: {
  icon: IconType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Flex align="center" gap="8px">
      <Icon as={icon} boxSize="14px" color={color} />
      <Text
        as="h3"
        color="#0F1729"
        fontSize="14px"
        fontWeight={700}
        lineHeight="19.5px"
      >
        {children}
      </Text>
    </Flex>
  );
}

/** Tabela rótulo/valor em caixa cinza. */
function DetailRows({
  rows,
}: {
  rows: { key: string; label: string; value: string }[];
}) {
  return (
    <Box
      as="dl"
      bg="#F8F9FB"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      {rows.map((row, index) => (
        <Flex
          key={row.key}
          align="flex-start"
          justify="space-between"
          gap="16px"
          px="16px"
          py="12px"
          borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
          borderColor="#F4F6F9"
        >
          <Text
            as="dt"
            color="#8A9AB5"
            fontSize="12px"
            lineHeight="18px"
            flexShrink={0}
          >
            {row.label}
          </Text>
          <Text
            as="dd"
            color="#0F1729"
            fontSize="12px"
            fontWeight={600}
            lineHeight="18px"
            textAlign="right"
            minW={0}
          >
            {row.value}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}

const METRICS = [
  {
    key: "views",
    icon: LuEye,
    color: "#1F5AFF",
    bg: "#EEF3FF",
    border: "#C7D8FF",
  },
  {
    key: "orders",
    icon: LuShoppingCart,
    color: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
  },
  {
    key: "revenue",
    icon: LuTrendingUp,
    color: "#8B5CF6",
    bg: "#F3EEFF",
    border: "#D3BFFD",
  },
] as const;

const SOLID_BUTTON = {
  h: "37px",
  px: "12px",
  gap: "6px",
  rounded: "10px",
  bg: "#8B5CF6",
  color: "white",
  fontSize: "14px",
  fontWeight: 500,
  _hover: { bg: "#7C4DEB" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
} as const;

/**
 * Detalhe de uma oferta no catálogo do seller (Figma 2098-31809): capa,
 * status, especificações, cobertura, preço e descrição, com as ações de
 * editar e patrocinar.
 *
 * Avaliação, visualizações, pedidos e receita por oferta ainda não têm
 * endpoint — os cards mostram "—". A imagem de capa também não é guardada
 * pela API.
 */
export function SellerOfferDetail({
  offering,
  specificationName,
  locale,
  isPromoting = false,
  onBack,
  onEdit,
  onTogglePromotion,
}: SellerOfferDetailProps) {
  const { t } = useTranslation();
  const [showFullDescription, setShowFullDescription] = React.useState(true);

  const status = offering.status ?? "draft";
  const statusStyle = OFFERING_STATUS_STYLES[status];
  const isArchived = status === "archived";
  // Os valores do assistente já vêm normalizados do `metadata`.
  const values = offeringToFormValues(offering, specificationName);
  const category = offerCategory(values.category);
  const categoryLabel = category
    ? t(`SellerOfferCreate.categories.${category.key}.label`)
    : specificationName;
  const currency = values.currency;

  const reference = `OFR-${offering.id.slice(0, 8).toUpperCase()}`;
  const subtitle = [
    reference,
    offering.createdAt &&
      t("SellerOffers.card.createdAt", {
        date: formatDate(offering.createdAt, locale),
      }),
  ]
    .filter(Boolean)
    .join(" · ");

  const specRows = [
    {
      key: "technicalSla",
      label: t("SellerOfferDetail.specs.technicalSla"),
      value: formatPercent(values.technicalSla, locale) ?? DASH,
    },
    {
      key: "acceptanceSla",
      label: t("SellerOfferDetail.specs.acceptanceSla"),
      value: formatHours(values.acceptanceSla) ?? DASH,
    },
    {
      key: "deliveryTime",
      label: t("SellerOfferDetail.specs.deliveryTime"),
      value: values.deliveryTime || DASH,
    },
    {
      key: "cancellation",
      label: t("SellerOfferDetail.specs.cancellation"),
      value: values.cancellationTerms || DASH,
    },
  ];
  if (offering.speed) {
    specRows.unshift({
      key: "speed",
      label: t("SellerOfferDetail.specs.speed"),
      value: offering.speed,
    });
  }
  if (values.maxLatency) {
    specRows.splice(offering.speed ? 1 : 0, 0, {
      key: "latency",
      label: t("SellerOfferDetail.specs.latency"),
      value: `${values.maxLatency} ms`,
    });
  }

  const monthly = values.pricingModel === "monthly";
  const price = formatCurrency(offering.monthlyPrice, currency, locale);
  const installation = Number(offering.installationPrice);
  const stock = parseDecimal(values.stock);
  const priceRows = [
    {
      key: "pricingModel",
      label: t("SellerOfferDetail.pricing.model"),
      value: values.pricingModel
        ? t(`SellerOfferDetail.pricing.models.${values.pricingModel}`)
        : DASH,
    },
    {
      key: "currency",
      label: t("SellerOfferDetail.pricing.currency"),
      value: currency,
    },
    {
      key: "price",
      label: t("SellerOfferDetail.pricing.price"),
      value: monthly ? t("SellerOffers.card.perMonth", { price }) : price,
    },
    {
      key: "setup",
      label: t("SellerOfferDetail.pricing.setup"),
      value:
        installation > 0
          ? formatCurrency(installation, currency, locale)
          : DASH,
    },
    {
      key: "stock",
      label: t("SellerOfferDetail.pricing.stock"),
      value:
        stock === null
          ? t("SellerOfferDetail.pricing.stockOnRequest")
          : t("SellerOfferDetail.pricing.stockUnits", { count: stock }),
    },
    {
      key: "validUntil",
      label: t("SellerOfferDetail.pricing.validUntil"),
      value:
        (values.validUntil && formatIsoDate(values.validUntil, locale)) ||
        t("SellerOfferDetail.pricing.noExpiry"),
    },
  ];

  const coverage = !category?.requiresCoverage
    ? {
        title: t("SellerOfferCreate.coverage.notApplicableTitle"),
        text: category
          ? t(`SellerOfferCreate.coverage.notApplicable.${category.key}`)
          : t("SellerOfferDetail.coverage.unknownCategory"),
        action: null,
      }
    : offering.coverageVersionId
      ? {
          title: t("SellerOfferDetail.coverage.boundTitle"),
          text: t("SellerOfferDetail.coverage.boundText", {
            version: offering.coverageVersionId.slice(0, 8),
          }),
          action: t("SellerOfferDetail.coverage.replace"),
        }
      : {
          title: t("SellerOfferDetail.coverage.emptyTitle"),
          text: t("SellerOfferDetail.coverage.emptyText"),
          action: t("SellerOfferDetail.coverage.upload"),
        };

  return (
    <Box
      as="article"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="22px"
      p="1px"
    >
      {/* Capa — a API ainda não guarda imagem. */}
      <Flex
        position="relative"
        h="129px"
        align="center"
        justify="center"
        bg="#EEF3FF"
        rounded="21px"
      >
        <Stack align="center" gap="8px" opacity={0.3}>
          <Icon as={LuImage} boxSize="36px" color="#1F5AFF" />
          <Text color="#5A6478" fontSize="11px" fontWeight={600}>
            {t("SellerOfferDetail.noCover")}
          </Text>
        </Stack>
        <Flex
          position="absolute"
          top="12px"
          left="16px"
          align="center"
          gap="6px"
          px="11px"
          py="5px"
          bg={statusStyle.bg}
          borderWidth="1px"
          borderColor={statusStyle.border}
          rounded="10px"
        >
          <Box boxSize="6px" rounded="full" bg={statusStyle.dot} />
          <Text
            color={statusStyle.color}
            fontSize="11px"
            fontWeight={600}
            lineHeight="16.5px"
          >
            {t(`SellerOffers.card.statuses.${status}`)}
          </Text>
        </Flex>
        {offering.isPromoted && (
          <Flex
            position="absolute"
            top="12px"
            right="16px"
            align="center"
            gap="4px"
            px="11px"
            py="5px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="10px"
          >
            <Icon as={LuZap} boxSize="11px" color="#D97706" />
            <Text
              color="#D97706"
              fontSize="11px"
              fontWeight={600}
              lineHeight="16.5px"
            >
              {t("SellerOffers.card.promoted")}
            </Text>
          </Flex>
        )}
      </Flex>

      <Stack gap="20px" p={{ base: "16px", md: "24px" }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "center" }}
          justify="space-between"
          gap="16px"
        >
          <Stack gap="6px" minW={0}>
            <Text
              as="h2"
              color="#0F1729"
              fontSize="20px"
              fontWeight={800}
              lineHeight="25px"
            >
              {offering.name}
            </Text>
            <Flex align="center" gap="8px" wrap="wrap">
              {categoryLabel && (
                <Flex
                  align="center"
                  gap="6px"
                  px="11px"
                  py="3px"
                  bg={category?.tone.bg ?? "#F4F6F9"}
                  borderWidth="1px"
                  borderColor={category?.tone.border ?? "#E5E8EE"}
                  rounded="10px"
                >
                  <Icon
                    as={category?.icon ?? LuPackage}
                    boxSize="14px"
                    color={category?.tone.fg ?? "#5A6478"}
                  />
                  <Text
                    color={category?.tone.fg ?? "#5A6478"}
                    fontSize="11px"
                    fontWeight={600}
                    lineHeight="16.5px"
                  >
                    {categoryLabel}
                  </Text>
                </Flex>
              )}
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                {subtitle}
              </Text>
            </Flex>
          </Stack>

          <SimpleGrid
            columns={3}
            gap="12px"
            w={{ base: "full", lg: "561px" }}
            flexShrink={0}
          >
            {METRICS.map((metric) => (
              <Stack
                key={metric.key}
                gap="6px"
                p="13px"
                bg={metric.bg}
                borderWidth="1px"
                borderColor={metric.border}
                rounded="14px"
                minW={0}
              >
                <Flex align="center" gap="6px">
                  <Icon as={metric.icon} boxSize="14px" color={metric.color} />
                  <Text
                    color="#5A6478"
                    fontSize="12px"
                    fontWeight={600}
                    lineHeight="16.5px"
                    truncate
                  >
                    {t(`SellerOffers.card.metrics.${metric.key}`)}
                  </Text>
                </Flex>
                <Text
                  color="#0F1729"
                  fontSize="15px"
                  fontWeight={800}
                  lineHeight="22.5px"
                >
                  {DASH}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Flex>

        <Grid
          templateColumns={{
            base: "1fr",
            lg: "minmax(0, 576px) minmax(0, 1fr)",
          }}
          gap="25px"
          alignItems="start"
        >
          <Stack gap="11px">
            <Stack gap="12px">
              <SectionTitle icon={LuShield} color="#1F5AFF">
                {t("SellerOfferDetail.specs.title")}
              </SectionTitle>
              <DetailRows rows={specRows} />
            </Stack>

            <Stack gap="12px">
              <SectionTitle icon={LuMapPin} color="#10B981">
                {t("SellerOfferDetail.coverage.title")}
              </SectionTitle>
              <Stack
                align="center"
                gap="12px"
                p="17px"
                bg="#F8F9FB"
                borderWidth="1px"
                borderColor="#E5E8EE"
                rounded="14px"
                textAlign="center"
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="40px"
                  bg="#EDFBF5"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                  rounded="14px"
                >
                  <Icon as={LuMapPin} boxSize="18px" color="#10B981" />
                </Flex>
                <Stack gap="2px">
                  <Text
                    color="#5A6478"
                    fontSize="13px"
                    fontWeight={600}
                    lineHeight="19.5px"
                  >
                    {coverage.title}
                  </Text>
                  <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                    {coverage.text}
                  </Text>
                </Stack>
                {coverage.action && !isArchived && (
                  <Button
                    variant="outline"
                    h="36px"
                    px="13px"
                    gap="6px"
                    rounded="10px"
                    borderColor="#E5E8EE"
                    color="#5A6478"
                    fontSize="12px"
                    fontWeight={500}
                    onClick={onEdit}
                  >
                    <Icon as={LuUpload} boxSize="12px" />
                    {coverage.action}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          <Stack gap="12px">
            <SectionTitle icon={LuDollarSign} color="#8B5CF6">
              {t("SellerOfferDetail.pricing.title")}
            </SectionTitle>
            <DetailRows rows={priceRows} />
            <Flex gap="8px" px="4px">
              <Icon
                as={LuInfo}
                boxSize="12px"
                color="#A0ABB8"
                mt="2px"
                flexShrink={0}
              />
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                {t("SellerOfferDetail.pricing.sponsorNote")}
              </Text>
            </Flex>
          </Stack>
        </Grid>

        <Stack gap="10px">
          <Text
            as="h3"
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("SellerOfferDetail.description.title")}
          </Text>
          <Box
            px="17px"
            py="15px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            <Text color="#0F1729" fontSize="14px" lineHeight="21px">
              {values.shortDescription || DASH}
            </Text>
          </Box>
          {values.description && (
            <Stack
              gap="4px"
              px="17px"
              py="15px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="14px"
            >
              <Button
                variant="plain"
                alignSelf="flex-start"
                h="auto"
                p={0}
                color="#A0ABB8"
                fontSize="12px"
                fontWeight={700}
                lineHeight="13.5px"
                letterSpacing="0.45px"
                textTransform="uppercase"
                aria-expanded={showFullDescription}
                aria-controls="offer-full-description"
                _hover={{ color: "#5A6478" }}
                onClick={() => setShowFullDescription((open) => !open)}
              >
                {showFullDescription
                  ? t("SellerOfferDetail.description.hide")
                  : t("SellerOfferDetail.description.show")}
              </Button>
              {showFullDescription && (
                <Text
                  id="offer-full-description"
                  color="#5A6478"
                  fontSize="13px"
                  lineHeight="21.125px"
                  whiteSpace="pre-line"
                >
                  {values.description}
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        <Flex
          align="center"
          justify="space-between"
          gap="12px"
          pt="9px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
          wrap="wrap"
        >
          <Button
            variant="outline"
            h="47px"
            w="148px"
            rounded="16px"
            borderColor="#E5E8EE"
            color="#8A9AB5"
            fontSize="14.5px"
            fontWeight={500}
            onClick={onBack}
          >
            {t("SellerOfferDetail.actions.back")}
          </Button>
          <Flex gap="9px" wrap="wrap">
            <Button {...SOLID_BUTTON} disabled={isArchived} onClick={onEdit}>
              <Icon as={LuPencil} boxSize="15px" />
              {t("SellerOfferDetail.actions.edit")}
            </Button>
            <Button
              {...SOLID_BUTTON}
              disabled={isArchived}
              loading={isPromoting}
              onClick={onTogglePromotion}
            >
              <Icon as={offering.isPromoted ? LuZap : LuPlay} boxSize="12px" />
              {offering.isPromoted
                ? t("SellerOfferDetail.actions.unsponsor")
                : t("SellerOfferDetail.actions.sponsor")}
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Box>
  );
}
