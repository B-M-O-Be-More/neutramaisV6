"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuZap } from "react-icons/lu";

import {
  DashboardFeaturedOffer,
  DashboardFeaturedOffersProps,
  DashboardOfferTagTone,
} from "./interface";

const TAG_COLORS: Record<DashboardOfferTagTone, string> = {
  brand: "#1F5AFF",
  success: "#10B981",
  seller: "#8B5CF6",
};

function OfferRow({ offer }: { offer: DashboardFeaturedOffer }) {
  const { t } = useTranslation();

  return (
    <Flex
      align="center"
      gap="12px"
      px="20px"
      pt="16px"
      pb="17px"
      borderBottomWidth="1px"
      borderColor="#F4F6F9"
      _last={{ borderBottomWidth: 0, pb: "16px" }}
    >
      <Flex
        boxSize="40px"
        align="center"
        justify="center"
        bg="#EEF3FF"
        borderWidth="1px"
        borderColor="#C7D8FF"
        rounded="14px"
        flexShrink={0}
      >
        <Icon as={LuZap} boxSize="16px" color="#1F5AFF" />
      </Flex>

      <Stack flex="1" minW={0} gap={0}>
        <Flex align="center" gap="8px" minW={0}>
          <Text
            truncate
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {offer.title}
          </Text>
          {offer.tag && (
            <Text
              as="span"
              px="6px"
              py="2px"
              rounded="8px"
              bg={TAG_COLORS[offer.tag.tone]}
              color="white"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {offer.tag.label}
            </Text>
          )}
        </Flex>
        <Text truncate color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
          {[
            offer.provider,
            offer.category,
            t("Dashboard.featuredOffers.sla", { value: offer.sla ?? "—" }),
          ].join(" · ")}
        </Text>
      </Stack>

      <Stack gap={0} align="flex-end" flexShrink={0}>
        <Text
          color="#0F1729"
          fontSize="14px"
          fontWeight={800}
          lineHeight="21px"
          whiteSpace="nowrap"
        >
          {offer.price}
          {offer.isMonthly && t("Dashboard.featuredOffers.perMonth")}
        </Text>
        <Link
          asChild
          pt="6px"
          color="#1F5AFF"
          fontSize="11px"
          fontWeight={600}
          lineHeight="16.5px"
        >
          <NextLink href={offer.href}>
            {t("Dashboard.featuredOffers.buy")}
          </NextLink>
        </Link>
      </Stack>
    </Flex>
  );
}

/** Card "Ofertas em destaque" com a lista curta de ofertas do marketplace. */
export function DashboardFeaturedOffers({
  offers,
  viewAllHref,
}: DashboardFeaturedOffersProps) {
  const { t } = useTranslation();

  return (
    <Box
      as="section"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        px="20px"
        pt="16px"
        pb="17px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Text
          as="h3"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("Dashboard.featuredOffers.title")}
        </Text>
        <Link
          asChild
          color="#1F5AFF"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
        >
          <NextLink href={viewAllHref}>
            {t("Dashboard.featuredOffers.viewAll")}
          </NextLink>
        </Link>
      </Flex>

      {offers.map((offer) => (
        <OfferRow key={offer.id} offer={offer} />
      ))}
    </Box>
  );
}
