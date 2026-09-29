"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuClock,
  LuMapPin,
  LuShieldCheck,
  LuShoppingCart,
  LuStar,
} from "react-icons/lu";

import { OFFER_CATEGORY_PALETTE as CATEGORIES } from "./categories";
import {
  MarketplaceOfferCardProps,
  MarketplaceOfferStatTone,
} from "./interface";

const STAT_COLORS: Record<MarketplaceOfferStatTone, string> = {
  brand: "#1F5AFF",
  success: "#10B981",
  neutral: "#5A6478",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Card de oferta do marketplace.
 * Capa tingida pela categoria, bloco do provedor (reputação e selos), resumo,
 * destaque técnico, indicadores, preço e as ações de compra. Os botões ficam
 * sempre na base, alinhando os cards da mesma linha.
 */
export function MarketplaceOfferCard({
  category,
  title,
  description,
  headline,
  stats,
  price,
  priceSuffix,
  previousPrice,
  priceNote,
  seller,
  categoryTag,
  highlightBadge,
  discountBadge,
  addHref,
  buyHref,
}: MarketplaceOfferCardProps) {
  const { t } = useTranslation();
  const palette = CATEGORIES[category];
  const rating = seller?.rating;

  return (
    <Stack
      as="article"
      h="full"
      gap={0}
      overflow="hidden"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      {/* Capa */}
      <Box position="relative" h="110px" bgImage={palette.gradient}>
        <Box
          aria-hidden
          position="absolute"
          top="-24px"
          right="-24px"
          boxSize="80px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.1)"
        />
        <Box
          aria-hidden
          position="absolute"
          bottom="-16px"
          left="-16px"
          boxSize="56px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.1)"
        />
        <Box
          aria-hidden
          position="absolute"
          insetX={0}
          bottom={0}
          h="32px"
          bgImage="linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent)"
        />

        <Stack
          position="absolute"
          inset={0}
          align="center"
          justify="center"
          gap="4px"
        >
          <Icon
            as={palette.icon}
            boxSize="28px"
            color="rgba(255, 255, 255, 0.6)"
          />
          <Text
            fontSize="10px"
            fontWeight={600}
            lineHeight="15px"
            letterSpacing="0.4px"
            color="rgba(255, 255, 255, 0.5)"
          >
            {t(`Marketplace.categories.items.${category}.title`)}
          </Text>
        </Stack>

        {highlightBadge ? (
          <Text
            position="absolute"
            top="8px"
            left="8px"
            px="8px"
            py="2px"
            rounded="8px"
            bg="#1F5AFF"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
            color="white"
          >
            {highlightBadge}
          </Text>
        ) : null}

        {discountBadge ? (
          <Text
            position="absolute"
            top="8px"
            right="8px"
            px="8px"
            py="2px"
            rounded="8px"
            bg="#10B981"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
            color="white"
          >
            {discountBadge}
          </Text>
        ) : null}
      </Box>

      {/* Provedor */}
      {seller || categoryTag ? (
        <Stack
          gap="12px"
          px="20px"
          pt="16px"
          pb="17px"
          borderBottomWidth="1px"
          borderColor="#F4F6F9"
        >
          {seller ? (
            <Flex align="center" gap="12px" minW={0}>
              <Flex
                align="center"
                justify="center"
                boxSize="36px"
                flexShrink={0}
                rounded="14px"
                borderWidth="1px"
                borderColor="#C7D8FF"
                bgImage="linear-gradient(135deg, #EEF3FF 0%, #DDE9FF 100%)"
              >
                <Text
                  fontSize="11px"
                  fontWeight={800}
                  lineHeight="16.5px"
                  color="#1F5AFF"
                >
                  {initials(seller.name)}
                </Text>
              </Flex>
              <Box minW={0}>
                <Text
                  truncate
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                  color="#0F1729"
                >
                  {seller.name}
                </Text>
                {seller.location ? (
                  <Flex align="center" gap="4px" pt="2px">
                    <Icon as={LuMapPin} boxSize="10px" color="#A0ABB8" />
                    <Text
                      truncate
                      fontSize="11px"
                      lineHeight="16.5px"
                      color="#A0ABB8"
                    >
                      {seller.location}
                    </Text>
                  </Flex>
                ) : null}
              </Box>
            </Flex>
          ) : null}

          <Flex align="center" gap="8px" wrap="wrap">
            {rating !== undefined ? (
              <Flex align="center" gap="8px">
                <Flex
                  align="center"
                  gap="2px"
                  aria-label={t("Marketplace.offers.ratingLabel", {
                    rating: rating.toFixed(1),
                  })}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= Math.floor(rating);
                    return (
                      <Icon
                        key={star}
                        as={LuStar}
                        boxSize="9px"
                        color={filled ? "#F59E0B" : "#D1D5DB"}
                        fill={filled ? "#F59E0B" : "#D1D5DB"}
                      />
                    );
                  })}
                </Flex>
                <Text
                  fontSize="12px"
                  fontWeight={700}
                  lineHeight="18px"
                  color="#0F1729"
                >
                  {rating.toFixed(1)}
                </Text>
                {seller?.reviewCount !== undefined ? (
                  <Text fontSize="11px" lineHeight="16.5px" color="#A0ABB8">
                    ({seller.reviewCount})
                  </Text>
                ) : null}
              </Flex>
            ) : null}

            <Flex align="center" gap="6px" ml="auto">
              {seller?.isVerified ? (
                <Flex
                  align="center"
                  gap="4px"
                  px="7px"
                  py="3px"
                  rounded="8px"
                  bg="#EDFBF5"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                >
                  <Icon as={LuShieldCheck} boxSize="8px" color="#10B981" />
                  <Text
                    fontSize="9px"
                    fontWeight={700}
                    lineHeight="13.5px"
                    color="#10B981"
                  >
                    {t("Marketplace.offers.kyc")}
                  </Text>
                </Flex>
              ) : null}
              {categoryTag ? (
                <Flex
                  align="center"
                  gap="4px"
                  px="6px"
                  py="2px"
                  rounded="8px"
                  bg="#F4F6F9"
                >
                  <Icon
                    as={palette.icon}
                    boxSize="12px"
                    color={palette.accent}
                  />
                  <Text
                    fontSize="9px"
                    fontWeight={600}
                    lineHeight="13.5px"
                    color="#5A6478"
                  >
                    {categoryTag}
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          </Flex>
        </Stack>
      ) : null}

      {/* Oferta */}
      <Stack flex="1" gap="16px" px="20px" py="16px">
        <Box>
          <Text
            as="h3"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
            color="#0F1729"
          >
            {title}
          </Text>
          {description ? (
            <Text pt="4px" fontSize="12px" lineHeight="19.5px" color="#8A9AB5">
              {description}
            </Text>
          ) : null}
        </Box>

        <Flex align="baseline" gap="6px">
          <Text
            fontSize="30px"
            fontWeight={800}
            lineHeight="30px"
            color="#1F5AFF"
          >
            {headline.value}
          </Text>
          {headline.unit ? (
            <Text
              fontSize="16px"
              fontWeight={600}
              lineHeight="24px"
              color="#8A9AB5"
            >
              {headline.unit}
            </Text>
          ) : null}
        </Flex>

        <Flex gap="8px">
          {stats.map((stat) => (
            <Stack
              key={stat.label}
              flex="1"
              minW={0}
              gap="4px"
              p="10px"
              rounded="10px"
              bg="#F8F9FB"
            >
              <Text
                truncate
                fontSize="9px"
                fontWeight={700}
                lineHeight="13.5px"
                letterSpacing="0.45px"
                textTransform="uppercase"
                color="#A0ABB8"
              >
                {stat.label}
              </Text>
              <Flex align="center" gap="4px" minW={0}>
                {stat.showClock ? (
                  <Icon as={LuClock} boxSize="10px" color="#F59E0B" />
                ) : null}
                <Text
                  truncate
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                  color={STAT_COLORS[stat.tone ?? "neutral"]}
                >
                  {stat.value}
                </Text>
              </Flex>
            </Stack>
          ))}
        </Flex>

        <Stack gap="2px">
          {previousPrice ? (
            <Text
              fontSize="12px"
              lineHeight="18px"
              color="#C4CDD8"
              textDecoration="line-through"
            >
              {previousPrice}
            </Text>
          ) : null}
          <Flex align="baseline" gap="4px">
            <Text
              fontSize="22px"
              fontWeight={800}
              lineHeight="33px"
              color="#0F1729"
            >
              {price}
            </Text>
            {priceSuffix ? (
              <Text fontSize="13px" lineHeight="19.5px" color="#A0ABB8">
                {priceSuffix}
              </Text>
            ) : null}
          </Flex>
          {priceNote ? (
            <Text fontSize="10px" lineHeight="15px" color="#A0ABB8">
              {priceNote}
            </Text>
          ) : null}
        </Stack>

        {/* `mt="auto"` mantém as ações na base do card. */}
        <Flex mt="auto" pt="4px" gap="8px">
          <Button
            asChild
            variant="plain"
            flex="1"
            h="41px"
            gap="6px"
            rounded="10px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#0F1729"
            fontSize="12.5px"
            fontWeight={600}
            _hover={{ bg: "#EEF1F5" }}
          >
            <Link href={addHref}>
              <Icon as={LuShoppingCart} boxSize="13px" />
              {t("Marketplace.offers.add")}
            </Link>
          </Button>
          <Button
            asChild
            variant="plain"
            flex="1"
            h="41px"
            rounded="10px"
            bg="#1F5AFF"
            color="white"
            fontSize="12.5px"
            fontWeight={700}
            boxShadow="0px 1px 1.5px rgba(0, 0, 0, 0.1), 0px 1px 1px rgba(0, 0, 0, 0.1)"
            _hover={{ bg: "#1A4FE6" }}
          >
            <Link href={buyHref}>{t("Marketplace.offers.buy")}</Link>
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}
