"use client";

import { Box, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuArrowRight, LuFlame, LuGift, LuSparkles } from "react-icons/lu";

import { MarketplacePublicPricesProps } from "./interface";

// "Preços públicos" do Figma (Neutra+ MP, nó 3300:59651): cabeçalho e 4 cards
// de campanha. Os valores do nó são 1:1.
const CAMPAIGNS: {
  key: "flashSale" | "news" | "forYou" | "highlight";
  icon: IconType;
  uppercase: boolean;
  ctaColor: string;
  background: string;
}[] = [
  {
    key: "flashSale",
    icon: LuFlame,
    uppercase: true,
    ctaColor: "#1F5AFF",
    background: "linear-gradient(90deg, #1F5AFF 0%, #6B9FFF 100%)",
  },
  {
    key: "news",
    icon: LuSparkles,
    uppercase: true,
    ctaColor: "#8B5CF6",
    background: "linear-gradient(90deg, #8B5CF6 0%, #C084FC 100%)",
  },
  {
    key: "forYou",
    icon: LuGift,
    uppercase: false,
    ctaColor: "#002776",
    background:
      "linear-gradient(90deg, #1013B9 0%, #1624BC 12.5%, #1C1FBF 25%, #2B20C3 37.5%, #3025C6 50%, #292CC9 62.5%, #2D35CC 75%, #3033D0 87.5%, #4434D3 100%)",
  },
  {
    key: "highlight",
    icon: LuGift,
    uppercase: true,
    ctaColor: "#10B981",
    background: "linear-gradient(90deg, #10B981 0%, #34D399 100%)",
  },
];

export function MarketplacePublicPrices({
  href = "/offers",
}: MarketplacePublicPricesProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      aria-labelledby="marketplace-public-prices-title"
      gap="24px"
    >
      <Flex
        align={{ base: "flex-start", md: "flex-end" }}
        justify="space-between"
        gap="16px"
        direction={{ base: "column", md: "row" }}
      >
        <Stack gap={0} minW={0}>
          <Text
            id="marketplace-public-prices-title"
            as="h2"
            color="#0F1729"
            fontSize="20px"
            fontWeight={700}
            lineHeight="30px"
          >
            {t("Marketplace.promotions.title")}
          </Text>
          <Text pt="4px" color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("Marketplace.promotions.subtitle")}
          </Text>
        </Stack>
        <Flex
          asChild
          align="center"
          gap="6px"
          flexShrink={0}
          color="#1F5AFF"
          fontSize="13px"
          fontWeight={600}
          lineHeight="19.5px"
          _hover={{ textDecoration: "underline" }}
        >
          <Link href={href}>
            {t("Marketplace.promotions.seeAll")}
            <Icon as={LuArrowRight} boxSize="14px" />
          </Link>
        </Flex>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        }}
        gap="20px"
      >
        {CAMPAIGNS.map((campaign) => {
          const item = (field: string) =>
            t(`Marketplace.promotions.items.${campaign.key}.${field}`);

          return (
            <Stack
              key={campaign.key}
              gap="8px"
              align="flex-start"
              minW={0}
              px="20px"
              py="16px"
              rounded="14px"
              bg={campaign.background}
              color="white"
            >
              <Flex align="center" gap="8px">
                <Flex
                  align="center"
                  justify="center"
                  boxSize="28px"
                  flexShrink={0}
                  rounded="10px"
                  bg="rgba(255, 255, 255, 0.2)"
                >
                  <Icon as={campaign.icon} boxSize="18px" />
                </Flex>
                <Text
                  px="8px"
                  py="2px"
                  rounded="full"
                  bg="rgba(255, 255, 255, 0.2)"
                  fontSize="9px"
                  fontWeight={700}
                  lineHeight="13.5px"
                  textTransform={campaign.uppercase ? "uppercase" : "none"}
                  whiteSpace="nowrap"
                >
                  {item("badge")}
                </Text>
              </Flex>
              <Text
                maxW="full"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
                truncate
              >
                {item("title")}
              </Text>
              <Text
                maxW="full"
                color="rgba(255, 255, 255, 0.75)"
                fontSize="11px"
                lineHeight="16.5px"
                truncate
              >
                {item("description")}
              </Text>
              <Box
                asChild
                px="12px"
                py="6px"
                rounded="10px"
                bg="white"
                color={campaign.ctaColor}
                fontSize="12px"
                fontWeight={700}
                lineHeight="18px"
                whiteSpace="nowrap"
                _hover={{ opacity: 0.9 }}
              >
                <Link href={href}>{`${item("cta")} →`}</Link>
              </Box>
            </Stack>
          );
        })}
      </Grid>
    </Stack>
  );
}
