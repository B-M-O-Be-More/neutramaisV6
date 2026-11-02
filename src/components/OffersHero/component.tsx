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
import { Trans, useTranslation } from "react-i18next";
import { LuSparkles } from "react-icons/lu";

import type { TrendingCategory } from "@/functions/offers";

import { OffersHeroProps } from "./interface";

// Atalhos do banner e a aba de "Produtos em alta" que cada um abre.
const SHORTCUTS: { key: string; category: TrendingCategory }[] = [
  { key: "fiber", category: "connectivity" },
  { key: "dedicatedLink", category: "connectivity" },
  { key: "ip", category: "numbering" },
  { key: "hardware", category: "hardware" },
];

/**
 * Banner da página de ofertas (Figma 2084-13834): selo, título com destaque
 * e os atalhos de categoria.
 */
export function OffersHero({ onSelectCategory }: OffersHeroProps) {
  const { t } = useTranslation();

  return (
    <Box
      position="relative"
      overflow="hidden"
      rounded="16px"
      bgImage="linear-gradient(170.6deg, #0F1729 0%, #1A2540 50%, #1F5AFF 100%)"
    >
      <Box
        aria-hidden
        position="absolute"
        top="-128px"
        right="58px"
        boxSize="384px"
        rounded="full"
        bg="rgba(31,90,255,0.2)"
      />
      <Box
        aria-hidden
        position="absolute"
        top="130px"
        left="43%"
        boxSize="256px"
        rounded="full"
        bg="rgba(139,92,246,0.15)"
      />

      <Flex
        position="relative"
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "flex-start" }}
        justify="space-between"
        gap="24px"
        minH="232px"
        px={{ base: "20px", md: "32px" }}
        pt="32px"
        pb={{ base: "24px", md: "16px" }}
      >
        <Stack gap="12px" maxW="750px">
          <Flex
            alignSelf="flex-start"
            align="center"
            gap="8px"
            px="13px"
            py="5px"
            bg="rgba(255,255,255,0.1)"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.2)"
            rounded="full"
          >
            <Icon as={LuSparkles} boxSize="11px" color="white" aria-hidden />
            <Text
              color="white"
              fontSize="11px"
              fontWeight={700}
              lineHeight="16.5px"
            >
              {t("Offers.hero.badge")}
            </Text>
          </Flex>
          <Text
            as="h1"
            color="white"
            fontSize={{ base: "22px", md: "28px" }}
            fontWeight={800}
            lineHeight={{ base: "28px", md: "33.6px" }}
            whiteSpace="pre-line"
          >
            <Trans
              i18nKey="Offers.hero.title"
              components={{ highlight: <Text as="span" color="#578CFD" /> }}
            />
          </Text>
        </Stack>

        <SimpleGrid
          as="nav"
          aria-label={t("Offers.hero.shortcutsLabel")}
          columns={2}
          gap="8px"
          flexShrink={0}
        >
          {SHORTCUTS.map(({ key, category }) => (
            <Button
              key={key}
              h="40px"
              px="13px"
              bg="rgba(255,255,255,0.1)"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.2)"
              rounded="full"
              color="white"
              fontSize="12px"
              fontWeight={400}
              lineHeight="18px"
              _hover={{ bg: "rgba(255,255,255,0.18)" }}
              onClick={() => onSelectCategory(category)}
            >
              {t(`Offers.hero.shortcuts.${key}`)}
            </Button>
          ))}
        </SimpleGrid>
      </Flex>
    </Box>
  );
}
