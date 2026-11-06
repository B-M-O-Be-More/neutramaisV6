"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuBadgeCheck, LuStore } from "react-icons/lu";

import { s } from "@/components/MarketplaceCatalog/scale";

import { MarketplaceSellerCardProps } from "./interface";

// O SVG já traz a textura com opacidade 12% enquadrada no card do Figma (585×423).
const BACKGROUND_IMAGE_URL = "/assets/Fundo-atualizado-Neutra%201.svg";
const BACKGROUND_GRADIENT =
  "linear-gradient(35.87deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(16, 185, 129, 0) 50%, rgba(16, 185, 129, 0.2) 100%)";
const BENEFIT_KEYS = ["noFee", "split", "score"] as const;

/**
 * Card de conversão para quem vende no marketplace.
 * Fundo escuro com a lista de benefícios e botão verde de cadastro.
 *
 * Medidas do Figma (nó 3300:58934) escritas na base de `s()`: valem 1:1 a
 * partir de 1536px e reduzidas abaixo disso.
 */
export function MarketplaceSellerCard({
  href = "/register?type=seller",
}: MarketplaceSellerCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      gap={s(24)}
      rounded={s(24)}
      h="full"
      minH={{ md: s(343.05) }}
      p={{ base: s(24), md: s(32) }}
      bgColor="#0F1729"
      color="white"
    >
      {/* Textura de fundo sobre o brilho verde do canto inferior direito. */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        bgImage={`url("${BACKGROUND_IMAGE_URL}"), ${BACKGROUND_GRADIENT}`}
        bgSize="cover"
        backgroundPosition="left top"
        bgRepeat="no-repeat"
      />
      <Icon
        aria-hidden
        as={LuStore}
        position="absolute"
        right={s(-16)}
        bottom={s(-16)}
        boxSize={s(110)}
        color="rgba(255, 255, 255, 0.05)"
      />

      <Stack position="relative" gap={0} align="flex-start">
        <Flex
          align="center"
          gap={s(6)}
          h={s(24.5)}
          mb={s(20)}
          px={s(12)}
          py={s(4)}
          rounded="full"
          bg="rgba(16, 185, 129, 0.2)"
          color="#6EE7B7"
          fontSize={s(11)}
          fontWeight={700}
          lineHeight={s(16.5)}
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          <Icon as={LuStore} boxSize={s(12)} />
          {t("Marketplace.catalog.seller.badge")}
        </Flex>

        <Text
          as="h3"
          fontSize={{ base: s(22), md: s(24) }}
          fontWeight={800}
          lineHeight={{ base: s(28), md: s(28.8) }}
        >
          {t("Marketplace.catalog.seller.title")}
        </Text>

        <Stack as="ul" gap={s(10)} pt={s(20)} listStyleType="none">
          {BENEFIT_KEYS.map((key) => (
            <Flex as="li" key={key} align="center" gap={s(8)}>
              <Icon
                as={LuBadgeCheck}
                boxSize={s(15)}
                flexShrink={0}
                color="#10B981"
              />
              <Text
                fontSize={s(13)}
                lineHeight={s(19.5)}
                color="rgba(255, 255, 255, 0.8)"
              >
                {t(`Marketplace.catalog.seller.benefits.${key}`)}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Stack>

      <Button
        asChild
        variant="plain"
        position="relative"
        flexShrink={0}
        w="full"
        h={s(49)}
        px={s(16)}
        gap={s(8)}
        rounded={s(14)}
        bg="#10B981"
        color="#052E22"
        fontSize={s(14)}
        fontWeight={700}
        lineHeight={s(21)}
        _hover={{ bg: "#0EA672" }}
      >
        <Link href={href}>
          {t("Marketplace.catalog.seller.cta")}
          <Icon as={LuArrowRight} boxSize={s(15)} />
        </Link>
      </Button>
    </Box>
  );
}
