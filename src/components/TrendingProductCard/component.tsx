"use client";

import { Box, Flex, Icon, IconButton, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuPlus, LuStar, LuTrendingUp } from "react-icons/lu";

import { OFFER_CATEGORY_PALETTE } from "@/components/MarketplaceOfferCard/categories";

import { TrendingProductCardProps } from "./interface";

/**
 * Produto em alta (Figma 2772-34378): capa da categoria com a posição no
 * ranking e o selo "Patrocinada" ou "Em alta", categoria, nome, preço e
 * "Adicionar". A API não traz foto, provedor, avaliações nem preço anterior —
 * esses blocos do design ficam de fora.
 */
export function TrendingProductCard({
  rank,
  title,
  category,
  price,
  priceSuffix,
  sponsored,
  addHref,
}: TrendingProductCardProps) {
  const { t } = useTranslation();
  const palette = OFFER_CATEGORY_PALETTE[category];

  return (
    <Stack
      as="article"
      gap="0"
      w="237px"
      h="full"
      overflow="hidden"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
    >
      <Box position="relative" h="143px" bgImage={palette.gradient}>
        <Flex position="absolute" inset={0} align="center" justify="center">
          <Icon
            as={palette.icon}
            boxSize="40px"
            color="rgba(255,255,255,0.45)"
            aria-hidden
          />
        </Flex>
        <Flex
          position="absolute"
          top="8px"
          left="8px"
          align="center"
          justify="center"
          boxSize="28px"
          bg="#0F1729"
          rounded="10px"
          color="white"
          fontSize="12px"
          fontWeight={900}
          lineHeight="18px"
          aria-label={t("Offers.trending.rank", { rank })}
        >
          {rank}
        </Flex>
        <Flex
          position="absolute"
          top="8px"
          right="8px"
          align="center"
          gap="4px"
          h="19px"
          px="6px"
          bg="rgba(255,255,255,0.95)"
          rounded="8px"
          color="#1F5AFF"
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
        >
          {sponsored ? (
            <Icon
              as={LuStar}
              boxSize="11px"
              color="#F59E0B"
              fill="#F59E0B"
              aria-hidden
            />
          ) : (
            <Icon as={LuTrendingUp} boxSize="10px" aria-hidden />
          )}
          {t(sponsored ? "Offers.sponsored" : "Offers.trending.hot")}
        </Flex>
      </Box>

      <Stack gap="8px" p="14px" flex="1">
        <Text
          color="#A0ABB8"
          fontSize="9px"
          fontWeight={700}
          lineHeight="13.5px"
          letterSpacing="0.45px"
          textTransform="uppercase"
        >
          {t(`Offers.trending.categories.${category}`)}
        </Text>
        <Text
          as="h3"
          minH="36px"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="18px"
          lineClamp={2}
        >
          {title}
        </Text>
        <Flex mt="auto" align="flex-end" justify="space-between" gap="8px">
          <Flex align="baseline" gap="2px" minW={0} wrap="wrap">
            <Text
              color="#0F1729"
              fontSize="16px"
              fontWeight={800}
              lineHeight="24px"
            >
              {price}
            </Text>
            {priceSuffix && (
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                {priceSuffix}
              </Text>
            )}
          </Flex>
          <IconButton
            asChild
            boxSize="32px"
            minW="32px"
            flexShrink={0}
            variant="plain"
            borderWidth="1px"
            borderColor="#C7D8FF"
            rounded="10px"
            color="#1F5AFF"
            _hover={{ bg: "#EEF3FF" }}
          >
            <NextLink
              href={addHref}
              aria-label={t("Offers.trending.add", { name: title })}
            >
              <Icon as={LuPlus} boxSize="15px" />
            </NextLink>
          </IconButton>
        </Flex>
      </Stack>
    </Stack>
  );
}
