"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuHardDrive, LuMapPin, LuShoppingCart, LuWifi } from "react-icons/lu";

import OfferCover from "@/components/OfferCover";
import OfferProviderSummary from "@/components/OfferProviderSummary";
import { timeLeft } from "@/functions/offers";
import type { OfferCoverKind } from "@/types/offers";

import { OfferCampaignCardProps } from "./interface";

const OFFER_COVER_ICONS: Record<OfferCoverKind, IconType> = {
  connectivity: LuWifi,
  hardware: LuHardDrive,
  forYou: LuShoppingCart,
};

/** Botão azul "Ver Oferta" dos cards da vitrine (Figma 2341-80219). */
const OFFER_VIEW_BUTTON = {
  w: "full",
  h: "34px",
  bg: "#1F5AFF",
  rounded: "10px",
  color: "white",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: "18px",
  _hover: { bg: "#1646CC" },
} as const;

/**
 * Card de campanha da vitrine (Figma 2084-20389 e 2084-20644): capa com selo,
 * provedor, categoria, abrangência, prazo da promoção, título e "Ver Oferta".
 */
export function OfferCampaignCard({
  offer,
  now,
  href,
}: OfferCampaignCardProps) {
  const { t } = useTranslation();
  const left = timeLeft(offer.expiresAt, now);

  return (
    <Stack
      as="article"
      gap="0"
      h="full"
      overflow="hidden"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <OfferCover
        kind={offer.cover}
        badge={t(`Offers.badges.${offer.badge}`)}
        icon={OFFER_COVER_ICONS[offer.cover]}
        caption={t(`Offers.covers.${offer.cover}`)}
        sponsoredLabel={offer.sponsored ? t("Offers.sponsored") : undefined}
        discountLabel={
          offer.discountPercent
            ? t("Offers.discount", { percent: offer.discountPercent })
            : undefined
        }
      />

      <Box
        px="16px"
        pt="16px"
        pb="13px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <OfferProviderSummary provider={offer.provider} />
      </Box>

      <Stack gap="12px" p="16px" flex="1" justify="space-between">
        <Stack gap="4px">
          <Flex align="center" justify="space-between" gap="8px" wrap="wrap">
            <Flex align="center" gap="5px" minW={0}>
              <Text
                color="#A0ABB8"
                fontSize="10px"
                fontWeight={700}
                lineHeight="15px"
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                {t(`Offers.categories.${offer.category}`)}
              </Text>
              {offer.location && (
                <Flex align="center" gap="4px" color="#A0ABB8">
                  <Icon as={LuMapPin} boxSize="10px" aria-hidden />
                  <Text fontSize="11px" lineHeight="16.5px">
                    {offer.location}
                  </Text>
                </Flex>
              )}
            </Flex>
            {left && (
              <Text
                px="8px"
                py="2px"
                bg="#10B981"
                rounded="8px"
                color="white"
                fontSize="10px"
                fontWeight={700}
                lineHeight="15px"
              >
                {t("Offers.expiresIn", left)}
              </Text>
            )}
          </Flex>
          <Text
            as="h3"
            color="#0F1729"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
          >
            {offer.title}
          </Text>
        </Stack>
        <Button asChild {...OFFER_VIEW_BUTTON}>
          <NextLink href={href}>{t("Offers.view")}</NextLink>
        </Button>
      </Stack>
    </Stack>
  );
}
