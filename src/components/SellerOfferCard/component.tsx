"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArchive,
  LuEye,
  LuHash,
  LuPackage,
  LuPause,
  LuPencil,
  LuPlay,
  LuSend,
  LuServer,
  LuToggleRight,
  LuWifi,
} from "react-icons/lu";

import { detectServiceType } from "@/components/SearchNetworkCatalog/offerings";
import { OFFERING_STATUS_STYLES } from "@/data/offeringStatus";
import type {
  OfferingAction,
  OfferingStatus,
} from "@/services/productCatalog.service";

import { SellerOfferCardProps } from "./interface";

type ActionKey = "pause" | "publish" | "unpublish" | "publishNow" | "republish";

interface ActionButton {
  key: ActionKey;
  action: OfferingAction;
  icon?: IconType;
  color: string;
  border?: string;
  bg?: string;
}

// Ações de cada status. A marketplace-api valida de novo: publicar exige
// organização ativa, KYC verificado e cobertura vinculada.
const STATUS_ACTIONS: Record<OfferingStatus, ActionButton[]> = {
  published: [
    {
      key: "pause",
      action: "pause",
      icon: LuPause,
      color: "#D97706",
      border: "#FDE68A",
    },
  ],
  paused: [
    {
      key: "publish",
      action: "publish",
      icon: LuPlay,
      color: "#10B981",
      border: "#AAECD5",
    },
    {
      key: "unpublish",
      action: "unpublish",
      color: "#D90606",
      border: "#FD8A8A",
    },
  ],
  draft: [
    {
      key: "publishNow",
      action: "publish",
      icon: LuSend,
      color: "white",
      bg: "#8B5CF6",
    },
  ],
  unpublished: [
    {
      key: "republish",
      action: "publish",
      icon: LuToggleRight,
      color: "#10B981",
      border: "#AAECD5",
    },
  ],
  archived: [],
};

/** Ícone pelo tipo de serviço inferido do nome (a API não expõe categoria). */
function categoryIcon(name: string): IconType {
  switch (detectServiceType({ name })) {
    case "fiber":
    case "dedicatedLink":
    case "mpls":
    case "voip":
      return LuWifi;
    case "colocation":
      return LuServer;
    case "ipTransit":
      return LuHash;
    default:
      return LuPackage;
  }
}

function formatPrice(value: number | string, locale: string): string {
  const amount = Number(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}

const SECONDARY_BUTTON = {
  variant: "plain",
  h: "32px",
  px: "13px",
  gap: "6px",
  rounded: "10px",
  borderWidth: "1px",
  fontSize: "12px",
  lineHeight: "18px",
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
} as const;

/**
 * Card de uma oferta no catálogo do seller: status, preço, métricas e as ações
 * do ciclo de vida (publicar, pausar, despublicar, arquivar).
 *
 * Visualizações, pedidos e receita por oferta ainda não têm endpoint (vêm do
 * serviço de pedidos) — aparecem como "—" até existirem.
 */
export function SellerOfferCard({
  offering,
  categoryName,
  locale,
  isPending = false,
  onAction,
}: SellerOfferCardProps) {
  const { t } = useTranslation();
  const status = offering.status ?? "draft";
  const style = OFFERING_STATUS_STYLES[status];
  const description =
    typeof offering.metadata?.description === "string"
      ? offering.metadata.description
      : null;
  const subtitle = [
    categoryName,
    offering.createdAt &&
      t("SellerOffers.card.createdAt", {
        date: formatDate(offering.createdAt, locale),
      }),
  ]
    .filter(Boolean)
    .join(" · ");

  const metrics = [
    {
      key: "price",
      color: "#8B5CF6",
      value: t("SellerOffers.card.perMonth", {
        price: formatPrice(offering.monthlyPrice, locale),
      }),
    },
    { key: "views", color: "#1F5AFF", value: "—" },
    { key: "orders", color: "#10B981", value: "—" },
    { key: "revenue", color: "#10B981", value: "—" },
  ];

  return (
    <Stack
      as="article"
      gap="16px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor={style.border}
      rounded="14px"
      aria-busy={isPending}
    >
      <Flex align="flex-start" justify="space-between" gap="12px">
        <Flex align="flex-start" gap="12px" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg="#F3EEFF"
            borderWidth="1px"
            borderColor="#D3BFFD"
            rounded="14px"
          >
            <Icon
              as={categoryIcon(offering.name)}
              boxSize="14px"
              color="#8B5CF6"
            />
          </Flex>
          <Stack gap={0} minW={0}>
            <Flex align="center" gap="6px" wrap="wrap">
              <Text
                as="h3"
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {offering.name}
              </Text>
              {offering.isPromoted && (
                <Text
                  as="span"
                  px="6px"
                  py="1px"
                  bg="#FFFBEB"
                  borderWidth="1px"
                  borderColor="#FDE68A"
                  rounded="6px"
                  color="#D97706"
                  fontSize="8.5px"
                  fontWeight={700}
                  lineHeight="13px"
                  letterSpacing="0.4px"
                  textTransform="uppercase"
                >
                  {t("SellerOffers.card.promoted")}
                </Text>
              )}
            </Flex>
            {subtitle && (
              <Text
                pt="2px"
                color="#A0ABB8"
                fontSize="11px"
                lineHeight="16.5px"
                truncate
              >
                {subtitle}
              </Text>
            )}
            {description && (
              <Text
                pt="2px"
                color="#8A9AB5"
                fontSize="11px"
                lineHeight="15px"
                lineClamp={2}
              >
                {description}
              </Text>
            )}
          </Stack>
        </Flex>

        <Flex
          align="center"
          gap="6px"
          px="10px"
          py="4px"
          flexShrink={0}
          bg={style.bg}
          rounded="10px"
        >
          <Box boxSize="6px" rounded="full" bg={style.dot} />
          <Text
            color={style.color}
            fontSize="11px"
            fontWeight={600}
            lineHeight="16.5px"
            whiteSpace="nowrap"
          >
            {t(`SellerOffers.card.statuses.${status}`)}
          </Text>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 2, sm: 4 }} gap="8px">
        {metrics.map((metric) => (
          <Stack key={metric.key} gap={0} minW={0}>
            <Text
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t(`SellerOffers.card.metrics.${metric.key}`)}
            </Text>
            <Text
              pt="4px"
              color={metric.color}
              fontSize="12px"
              fontWeight={700}
              lineHeight="18px"
              truncate
            >
              {metric.value}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <Flex
        align="center"
        gap="8px"
        pt="13px"
        mt="auto"
        borderTopWidth="1px"
        borderColor="#F4F6F9"
        wrap="wrap"
      >
        {/* Editar abre o detalhe da oferta, de onde se edita e patrocina.
            Arquivada é só leitura, mas o detalhe continua acessível. O
            preview do marketplace ainda não tem tela. */}
        <Button
          asChild
          {...SECONDARY_BUTTON}
          bg="#F3EEFF"
          borderColor="#D3BFFD"
          color="#8B5CF6"
          fontWeight={600}
        >
          <NextLink href={`/seller/offers/${encodeURIComponent(offering.id)}`}>
            <Icon as={LuPencil} boxSize="12px" />
            {t("SellerOffers.card.actions.edit")}
          </NextLink>
        </Button>
        <Button
          {...SECONDARY_BUTTON}
          disabled
          borderColor="#E5E8EE"
          color="#5A6478"
          fontWeight={500}
        >
          <Icon as={LuEye} boxSize="12px" />
          {t("SellerOffers.card.actions.preview")}
        </Button>

        {STATUS_ACTIONS[status].map((button) => (
          <Button
            key={button.key}
            {...SECONDARY_BUTTON}
            disabled={isPending}
            h={button.bg ? "34px" : "32px"}
            px={button.bg ? "12px" : "13px"}
            bg={button.bg ?? "transparent"}
            borderWidth={button.bg ? 0 : "1px"}
            borderColor={button.border}
            color={button.color}
            fontWeight={button.bg ? 600 : 500}
            _hover={{ opacity: 0.85 }}
            onClick={() => onAction(button.action)}
          >
            {button.icon && <Icon as={button.icon} boxSize="12px" />}
            {t(`SellerOffers.card.actions.${button.key}`)}
          </Button>
        ))}

        {status !== "archived" && (
          <Button
            variant="plain"
            ms="auto"
            h="32px"
            px="12px"
            gap="6px"
            rounded="10px"
            color="#A0ABB8"
            fontSize="12px"
            fontWeight={500}
            lineHeight="18px"
            disabled={isPending}
            _hover={{ color: "#5A6478" }}
            onClick={() => onAction("archive")}
          >
            <Icon as={LuArchive} boxSize="12px" />
            {t("SellerOffers.card.actions.archive")}
          </Button>
        )}
      </Flex>
    </Stack>
  );
}
