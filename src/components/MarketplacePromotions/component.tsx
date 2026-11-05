"use client";

import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { MarketplacePromotionsProps } from "./interface";

const BENEFITS = [
  {
    key: "escrow",
    icon: "verified-sellers.svg",
    tone: "blue",
    titleKey: "escrowTitle",
    descriptionKey: "escrowDescription",
  },
  {
    key: "verifiedSellers",
    icon: "escrow.svg",
    tone: "green",
    titleKey: "verifiedTitle",
    descriptionKey: "verifiedDescription",
  },
  {
    key: "contract",
    icon: "contract.svg",
    tone: "purple",
    titleKey: "contractTitle",
    descriptionKey: "contractDescription",
  },
  {
    key: "priceSnapshot",
    icon: "price-snapshot.svg",
    tone: "orange",
    titleKey: "snapshotTitle",
    descriptionKey: "snapshotDescription",
  },
] as const;

const BENEFIT_STYLES = {
  blue: { bg: "#EEF3FF", border: "#C7D8FF" },
  green: { bg: "#EDFBF5", border: "#AAECD5" },
  purple: { bg: "#F3EEFF", border: "#DDD0FF" },
  orange: { bg: "#FFF6E5", border: "#FFE0A8" },
} as const;

/**
 * Featured campaigns and trust benefits shown on the marketplace home.
 */
export function MarketplacePromotions({
  seeAllHref = "/marketplace",
}: MarketplacePromotionsProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      aria-label={t("Marketplace.benefitBanners.sectionLabel")}
      gap="12px"
      pt={{ base: "20px", md: "24px" }}
    >
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          lg: "repeat(2, minmax(0, 1fr))",
        }}
        gap="12px"
        alignItems="stretch"
      >
        <Box
          as="article"
          display="grid"
          minH={{ base: "168px", md: "144px" }}
          overflow="hidden"
          rounded="16px"
          bg="#1F5AFF"
          gridTemplateColumns="minmax(0, 1fr) 44%"
        >
          <Stack
            justify="center"
            gap="6px"
            minW={0}
            p={{ base: "18px", md: "24px" }}
          >
            <Text
              color="rgba(255, 255, 255, 0.8)"
              fontSize="10px"
              fontWeight={700}
              letterSpacing="0.5px"
              lineHeight="15px"
              textTransform="uppercase"
            >
              {t("Marketplace.benefitBanners.saleBadge")}
            </Text>
            <Text
              as="h2"
              color="white"
              fontSize={{ base: "17px", md: "19px" }}
              fontWeight={900}
              lineHeight="1.25"
            >
              {t("Marketplace.benefitBanners.saleTitle")}
            </Text>
            <Link href={seeAllHref}>
              <Text
                color="white"
                fontSize="10px"
                fontWeight={700}
                lineHeight="16px"
                textDecoration="underline"
                textUnderlineOffset="2px"
              >
                {t("Marketplace.benefitBanners.saleCta")}
              </Text>
            </Link>
          </Stack>
          <Image
            src="/images/marketplace/benefits/brand-router.jpg"
            alt={t("Marketplace.benefitBanners.saleImageAlt")}
            w="full"
            h="full"
            minH="full"
            objectFit="cover"
            objectPosition="center"
          />
        </Box>

        <Box
          as="article"
          display="grid"
          minH={{ base: "168px", md: "144px" }}
          overflow="hidden"
          rounded="16px"
          border="1px solid #E2D8FF"
          bg="#F1ECFF"
          gridTemplateColumns="minmax(0, 1fr) 44%"
        >
          <Stack
            justify="center"
            gap="6px"
            minW={0}
            p={{ base: "18px", md: "24px" }}
          >
            <Text
              color="#8B5CF6"
              fontSize="10px"
              fontWeight={700}
              letterSpacing="0.5px"
              lineHeight="15px"
              textTransform="uppercase"
            >
              {t("Marketplace.benefitBanners.creditBadge")}
            </Text>
            <Text
              as="h2"
              color="#0F1729"
              fontSize={{ base: "17px", md: "19px" }}
              fontWeight={900}
              lineHeight="1.25"
            >
              {t("Marketplace.benefitBanners.creditTitle")}
            </Text>
            <Link href="#marketplace-credit-banner">
              <Text
                color="#8B5CF6"
                fontSize="10px"
                fontWeight={700}
                lineHeight="16px"
                textDecoration="underline"
                textUnderlineOffset="2px"
              >
                {t("Marketplace.benefitBanners.creditCta")}
              </Text>
            </Link>
          </Stack>
          <Flex
            align="center"
            justify="center"
            overflow="hidden"
            bgImage="linear-gradient(148deg, #8B5CF6 0%, #1F5AFF 100%)"
            px={{ base: "10px", md: "16px" }}
          >
            <Stack
              w="full"
              maxW="220px"
              gap={0}
              p={{ base: "12px", md: "16px" }}
              rounded="14px"
              bg="white"
              boxShadow="0 14px 18px rgba(0, 0, 0, 0.16)"
              transform="rotate(-4deg)"
            >
              <Text color="#8A9AB5" fontSize="8px" lineHeight="12px">
                {t("Marketplace.benefitBanners.availableLimit")}
              </Text>
              <Text
                color="#0F1729"
                fontSize={{ base: "15px", md: "17px" }}
                fontWeight={900}
                lineHeight="24px"
                whiteSpace="nowrap"
              >
                {t("Marketplace.benefitBanners.creditAmount")}
              </Text>
              <Box
                mt="4px"
                h="4px"
                overflow="hidden"
                rounded="full"
                bg="#EEF3FF"
              >
                <Box h="full" w="60%" rounded="full" bg="#8B5CF6" />
              </Box>
            </Stack>
          </Flex>
        </Box>
      </Grid>

      <Flex
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap="16px"
        direction={{ base: "column", md: "row" }}
        px={{ base: "20px", md: "24px" }}
        py={{ base: "16px", md: "14px" }}
        rounded="16px"
        bgImage="linear-gradient(90deg, #8B5CF6 0%, #1F5AFF 100%)"
      >
        <Flex
          align={{ base: "flex-start", sm: "center" }}
          gap={{ base: "4px", sm: "18px" }}
          direction={{ base: "column", sm: "row" }}
        >
          <Text
            color="white"
            fontSize="22px"
            fontWeight={900}
            letterSpacing="-0.6px"
            lineHeight="30px"
            whiteSpace="nowrap"
          >
            neutra+{" "}
            <Text as="span" fontSize="14px">
              Pro
            </Text>
          </Text>
          <Text
            color="white"
            fontSize="11px"
            fontWeight={800}
            letterSpacing="0.3px"
            lineHeight="17px"
            textTransform="uppercase"
          >
            {t("Marketplace.benefitBanners.proHeadline")}
          </Text>
        </Flex>
        <Button
          type="button"
          disabled
          h="34px"
          px="16px"
          rounded="12px"
          bg="white"
          color="#6D3FE0"
          fontSize="10px"
          fontWeight={700}
          opacity={1}
          _disabled={{ bg: "white", color: "#6D3FE0", cursor: "default" }}
        >
          {t("Marketplace.benefitBanners.proCta")}
        </Button>
      </Flex>

      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        }}
        gap="10px"
      >
        {BENEFITS.map((benefit) => {
          const style = BENEFIT_STYLES[benefit.tone];

          return (
            <Flex
              key={benefit.key}
              align="center"
              gap="10px"
              minW={0}
              minH={{ base: "72px", md: "64px" }}
              p={{ base: "12px", md: "10px" }}
              rounded="14px"
              border="1px solid"
              borderColor={style.border}
              bg={style.bg}
            >
              <Flex
                align="center"
                justify="center"
                boxSize={{ base: "40px", md: "34px" }}
                flexShrink={0}
                rounded="10px"
                bg="white"
              >
                <Image
                  src={`/images/marketplace/benefits/${benefit.icon}`}
                  alt=""
                  aria-hidden
                  boxSize="18px"
                />
              </Flex>
              <Stack gap="2px" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="11px"
                  fontWeight={700}
                  lineHeight="16px"
                >
                  {t(`Marketplace.benefitBanners.${benefit.titleKey}`)}
                </Text>
                <Text color="#5A6478" fontSize="9px" lineHeight="14px">
                  {t(`Marketplace.benefitBanners.${benefit.descriptionKey}`)}
                </Text>
              </Stack>
            </Flex>
          );
        })}
      </Grid>
    </Stack>
  );
}
