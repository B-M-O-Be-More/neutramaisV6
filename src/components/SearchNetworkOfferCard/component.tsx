"use client";

import { Box, Button, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuClock,
  LuFileText,
  LuMapPin,
  LuShoppingCart,
  LuStar,
  LuZap,
} from "react-icons/lu";

import { OFFER_CATEGORY_PALETTE } from "@/components/MarketplaceOfferCard/categories";

import {
  SearchNetworkOfferBadgeTone,
  SearchNetworkOfferCardProps,
  SearchNetworkOfferStatTone,
} from "./interface";

const BADGE_COLORS: Record<SearchNetworkOfferBadgeTone, string> = {
  brand: "#1F5AFF",
  violet: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
};

const STAT_COLORS: Record<SearchNetworkOfferStatTone, string> = {
  neutral: "#5A6478",
  success: "#10B981",
};

function CoverBadge({
  label,
  bg,
  side,
}: {
  label: string;
  bg: string;
  side: "left" | "right";
}) {
  return (
    <Text
      position="absolute"
      top="8px"
      {...(side === "left" ? { left: "8px" } : { right: "8px" })}
      px="8px"
      py="2px"
      rounded="8px"
      bg={bg}
      color="white"
      fontSize="10px"
      fontWeight={700}
      lineHeight="15px"
    >
      {label}
    </Text>
  );
}

/**
 * Card de oferta da busca de redes: capa da categoria, provedor (reputação e
 * KYC), tipo de serviço e abrangência, destaque técnico, indicadores, preço e
 * as ações "Adicionar" e "Fazer Proposta" — sempre na base do card.
 */
export function SearchNetworkOfferCard({
  category,
  highlightBadge,
  discountBadge,
  seller,
  serviceType,
  location,
  title,
  headline,
  stats,
  price,
  priceSuffix,
  previousPrice,
  addHref,
  proposalHref,
}: SearchNetworkOfferCardProps) {
  const { t } = useTranslation();
  const palette = OFFER_CATEGORY_PALETTE[category];
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
      <Box
        position="relative"
        h="100px"
        overflow="hidden"
        bgImage={palette.gradient}
      >
        <Box
          aria-hidden
          position="absolute"
          top="-24px"
          right="-24px"
          boxSize="80px"
          rounded="full"
          bg="rgba(255,255,255,0.1)"
        />
        <Box
          aria-hidden
          position="absolute"
          top="60px"
          left="-16px"
          boxSize="56px"
          rounded="full"
          bg="rgba(255,255,255,0.1)"
        />
        <Box
          aria-hidden
          position="absolute"
          insetX={0}
          bottom={0}
          h="32px"
          bgImage="linear-gradient(to top, rgba(0,0,0,0.2), transparent)"
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
            color="rgba(255,255,255,0.6)"
          />
          <Text
            color="rgba(255,255,255,0.5)"
            fontSize="10px"
            fontWeight={600}
            lineHeight="15px"
            letterSpacing="0.4px"
          >
            {t(`Marketplace.categories.items.${category}.title`)}
          </Text>
        </Stack>

        {highlightBadge && (
          <CoverBadge
            side="left"
            label={highlightBadge.label}
            bg={BADGE_COLORS[highlightBadge.tone ?? "brand"]}
          />
        )}
        {discountBadge && (
          <CoverBadge side="right" label={discountBadge} bg="#10B981" />
        )}
      </Box>

      {/* Provedor */}
      {seller && (
        <Flex
          align="center"
          gap="10px"
          px="16px"
          pt="16px"
          pb="13px"
          borderBottomWidth="1px"
          borderColor="#F4F6F9"
        >
          <Flex
            boxSize="36px"
            align="center"
            justify="center"
            bg="#EEF3FF"
            borderWidth="1px"
            borderColor="#C7D8FF"
            rounded="10px"
            flexShrink={0}
          >
            <Icon as={LuZap} boxSize="14px" color="#1F5AFF" />
          </Flex>
          <Stack flex="1" minW={0} gap={0}>
            <Text
              truncate
              color="#0F1729"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
            >
              {seller.name}
            </Text>
            <Flex align="center" justify="space-between" gap="8px">
              {rating !== undefined ? (
                <Flex align="center" gap="6px">
                  <Flex
                    align="center"
                    gap="2px"
                    aria-label={t("SearchNetwork.catalog.card.ratingLabel", {
                      rating: rating.toFixed(1),
                    })}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = star <= Math.floor(rating);
                      return (
                        <Icon
                          key={star}
                          as={LuStar}
                          aria-hidden
                          boxSize="10px"
                          color={filled ? "#D29922" : "#D1D9E0"}
                          fill={filled ? "#D29922" : "none"}
                        />
                      );
                    })}
                  </Flex>
                  <Text
                    color="#0F1729"
                    fontSize="12px"
                    fontWeight={700}
                    lineHeight="18px"
                  >
                    {rating.toFixed(1)}
                  </Text>
                  {seller.reviewCount !== undefined && (
                    <Text color="#A0ABB8" fontSize="12px" lineHeight="18px">
                      ({seller.reviewCount})
                    </Text>
                  )}
                </Flex>
              ) : (
                <Box />
              )}
              {seller.isVerified && (
                <Text
                  px="7px"
                  py="3px"
                  rounded="8px"
                  bg="#EDFBF5"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                  color="#10B981"
                  fontSize="9px"
                  fontWeight={700}
                  lineHeight="13.5px"
                  flexShrink={0}
                >
                  {t("SearchNetwork.catalog.card.kyc")}
                </Text>
              )}
            </Flex>
          </Stack>
        </Flex>
      )}

      {/* Oferta */}
      <Stack flex="1" gap="12px" p="16px">
        <Stack gap={0}>
          <Flex align="center" gap="5px" minW={0}>
            <Text
              color="#A0ABB8"
              fontSize="10px"
              fontWeight={700}
              lineHeight="15px"
              letterSpacing="0.5px"
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              {serviceType}
            </Text>
            {location && (
              <Flex align="center" gap="4px" minW={0}>
                <Icon as={LuMapPin} boxSize="10px" color="#A0ABB8" />
                <Text
                  truncate
                  color="#A0ABB8"
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {location}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text
            as="h3"
            pt="4px"
            color="#0F1729"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
          >
            {title}
          </Text>
          <Flex align="baseline" gap="6px" pt="6px">
            <Text
              color="#1F5AFF"
              fontSize="26px"
              fontWeight={700}
              lineHeight="39px"
            >
              {headline.value}
            </Text>
            {headline.unit && (
              <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
                {headline.unit}
              </Text>
            )}
          </Flex>
        </Stack>

        {stats.length > 0 && (
          <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="6px">
            {stats.slice(0, 3).map((stat) => (
              <Stack
                key={stat.label}
                gap={0}
                minW={0}
                p="8px"
                rounded="10px"
                bg="#F4F6F9"
              >
                <Text
                  truncate
                  color="#A0ABB8"
                  fontSize="9px"
                  fontWeight={700}
                  lineHeight="13.5px"
                  textTransform="uppercase"
                >
                  {stat.label}
                </Text>
                <Flex align="center" gap="4px" pt="2px" minW={0}>
                  {stat.showClock && (
                    <Icon as={LuClock} boxSize="9px" color="#D29922" />
                  )}
                  <Text
                    truncate
                    color={STAT_COLORS[stat.tone ?? "neutral"]}
                    fontSize="12px"
                    fontWeight={700}
                    lineHeight="18px"
                  >
                    {stat.value}
                  </Text>
                </Flex>
              </Stack>
            ))}
          </Grid>
        )}

        <Stack gap={0}>
          {previousPrice && (
            <Text
              color="#C4CDD8"
              fontSize="12px"
              lineHeight="18px"
              textDecoration="line-through"
            >
              {previousPrice}
            </Text>
          )}
          <Flex align="baseline" gap="4px">
            <Text
              color="#0F1729"
              fontSize="20px"
              fontWeight={700}
              lineHeight="30px"
            >
              {price}
            </Text>
            {priceSuffix && (
              <Text color="#A0ABB8" fontSize="12px" lineHeight="18px">
                {priceSuffix}
              </Text>
            )}
          </Flex>
        </Stack>

        {/* `mt="auto"` mantém as ações na base do card. */}
        <Flex mt="auto" gap="8px">
          <Button
            asChild
            variant="plain"
            flex="1"
            h="40px"
            gap="6px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="10px"
            color="#0F1729"
            fontSize="12px"
            fontWeight={600}
            _hover={{ bg: "#F4F6F9" }}
          >
            <NextLink href={addHref}>
              <Icon as={LuShoppingCart} boxSize="13px" />
              {t("SearchNetwork.catalog.card.add")}
            </NextLink>
          </Button>
          <Button
            asChild
            variant="plain"
            flex="1"
            h="40px"
            gap="6px"
            bg="#8B5CF6"
            rounded="10px"
            color="white"
            fontSize="12px"
            fontWeight={700}
            _hover={{ bg: "#7C4DEB" }}
          >
            <NextLink href={proposalHref}>
              <Icon as={LuFileText} boxSize="12px" />
              {t("SearchNetwork.catalog.card.propose")}
            </NextLink>
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}
