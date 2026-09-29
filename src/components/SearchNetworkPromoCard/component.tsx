"use client";

import { Box, Flex, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";

import {
  SearchNetworkPromoCardProps,
  SearchNetworkPromoTone,
} from "./interface";

const BACKGROUNDS: Record<SearchNetworkPromoTone, string> = {
  blue: "linear-gradient(90deg, #1F5AFF 0%, #4F7FFF 100%)",
  violet: "linear-gradient(90deg, #7C3AED 0%, #A855F7 100%)",
  emerald: "linear-gradient(90deg, #059669 0%, #10B981 100%)",
  amber: "linear-gradient(90deg, #D29922 0%, #D29922 100%)",
};

/**
 * Card de campanha da busca de redes: emoji e selo, chamada, condições e o
 * botão translúcido "Ver oferta".
 */
export function SearchNetworkPromoCard({
  emoji,
  badge,
  title,
  description,
  href,
  tone,
}: SearchNetworkPromoCardProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="article"
      position="relative"
      flex="1"
      minW="260px"
      h="153.5px"
      gap={0}
      p="16px"
      overflow="hidden"
      rounded="14px"
      bgImage={BACKGROUNDS[tone]}
      color="white"
    >
      {/* Círculos decorativos */}
      <Box
        position="absolute"
        top="-16px"
        right="0"
        boxSize="80px"
        rounded="full"
        bg="rgba(255,255,255,0.1)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="65.5px"
        right="8px"
        boxSize="112px"
        rounded="full"
        bg="rgba(255,255,255,0.05)"
        pointerEvents="none"
      />

      <Flex position="relative" align="center" gap="8px">
        <Text as="span" fontSize="16px" lineHeight="24px" aria-hidden>
          {emoji}
        </Text>
        <Text
          as="span"
          px="9px"
          py="3px"
          rounded="full"
          bg="rgba(255,255,255,0.2)"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.3)"
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
          whiteSpace="nowrap"
        >
          {badge}
        </Text>
      </Flex>

      <Text
        as="h3"
        position="relative"
        truncate
        pt="8px"
        fontSize="15px"
        fontWeight={700}
        lineHeight="22.5px"
      >
        {title}
      </Text>
      <Text
        position="relative"
        truncate
        pt="8px"
        color="rgba(255,255,255,0.8)"
        fontSize="11px"
        lineHeight="16.5px"
      >
        {description}
      </Text>

      <Flex position="relative" pt="12px">
        <Link
          asChild
          px="13px"
          py="7px"
          rounded="10px"
          bg="rgba(255,255,255,0.2)"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.3)"
          color="white"
          fontSize="11px"
          fontWeight={600}
          lineHeight="16.5px"
          textDecoration="none"
          _hover={{ bg: "rgba(255,255,255,0.3)", textDecoration: "none" }}
        >
          <NextLink href={href}>{t("SearchNetwork.promotions.cta")}</NextLink>
        </Link>
      </Flex>
    </Stack>
  );
}
