"use client";

import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { MarketplacePromotionsProps } from "./interface";
import { s } from "./scale";

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

// Gradientes exatos do Figma (nó 3300:59720).
const CREDIT_GRADIENT =
  "linear-gradient(147.53deg, rgb(139, 92, 246) 0%, rgb(133, 92, 247) 7.69%, rgb(127, 93, 247) 15.38%, rgb(120, 93, 248) 23.08%, rgb(114, 93, 249) 30.77%, rgb(107, 93, 250) 38.46%, rgb(100, 93, 250) 46.15%, rgb(93, 93, 251) 53.85%, rgb(85, 92, 252) 61.54%, rgb(77, 92, 252) 69.23%, rgb(68, 92, 253) 76.92%, rgb(58, 91, 254) 84.62%, rgb(46, 91, 254) 92.31%, rgb(31, 90, 255) 100%)";
const PRO_GRADIENT =
  "linear-gradient(90deg, rgb(139, 92, 246) 0%, rgb(135, 88, 243) 7.14%, rgb(130, 84, 240) 14.29%, rgb(126, 80, 237) 21.43%, rgb(122, 76, 233) 28.57%, rgb(117, 72, 230) 35.71%, rgb(113, 67, 227) 42.86%, rgb(109, 63, 224) 50%, rgb(102, 68, 228) 57.14%, rgb(95, 72, 233) 64.29%, rgb(86, 76, 237) 71.43%, rgb(77, 80, 242) 78.57%, rgb(66, 83, 246) 85.71%, rgb(52, 87, 251) 92.86%, rgb(31, 90, 255) 100%)";

/**
 * Featured campaigns and trust benefits shown on the marketplace home.
 *
 * Medidas do Figma (Neutra+ MP, nó 3300:59720 "BenefitBanners"). A partir de
 * 1536px a seção usa os valores do Figma 1:1 (--promo-s = 1,2316 sobre a base
 * escrita aqui); abaixo disso, a mesma proporção reduzida.
 */
export function MarketplacePromotions({
  seeAllHref = "/marketplace",
}: MarketplacePromotionsProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      aria-label={t("Marketplace.benefitBanners.sectionLabel")}
      gap={s(12)}
      pt={{ base: "20px", md: 0 }}
      css={{
        "--promo-s": "1",
        "@media (min-width: 1536px)": { "--promo-s": "1.2316" },
      }}
    >
      <Grid
        templateColumns={{
          base: "minmax(0, 1fr)",
          lg: "repeat(2, minmax(0, 1fr))",
        }}
        gap={s(12)}
        alignItems="stretch"
      >
        <Box
          as="article"
          display="grid"
          minH={s(170)}
          overflow="hidden"
          rounded={s(16)}
          bg="#1F5AFF"
          gridTemplateColumns="minmax(0, 1fr) 44%"
        >
          <Stack
            justify="center"
            gap={s(8)}
            minW={0}
            p={{ base: "18px", md: s(24) }}
          >
            <Text
              color="rgba(255, 255, 255, 0.8)"
              fontSize={s(11)}
              fontWeight={700}
              letterSpacing={s(0.55)}
              lineHeight={s(16.5)}
              textTransform="uppercase"
            >
              {t("Marketplace.benefitBanners.saleBadge")}
            </Text>
            <Text
              as="h2"
              color="white"
              fontSize={{ base: "17px", md: s(20) }}
              fontWeight={900}
              lineHeight={{ base: "1.25", md: s(25) }}
              textWrap="balance"
            >
              {t("Marketplace.benefitBanners.saleTitle")}
            </Text>
            <Link href={seeAllHref}>
              <Text
                color="white"
                fontSize={s(12)}
                fontWeight={700}
                lineHeight={s(18)}
                textDecoration="underline"
                textUnderlineOffset="2px"
              >
                {t("Marketplace.benefitBanners.saleCta")}
              </Text>
            </Link>
          </Stack>
          <Box position="relative" minH="full" bg="#FFE600">
            <Image
              src="/images/marketplace/benefits/brand-router.jpg"
              alt={t("Marketplace.benefitBanners.saleImageAlt")}
              position="absolute"
              inset={0}
              w="full"
              h="full"
              objectFit="cover"
              objectPosition="center"
            />
          </Box>
        </Box>

        <Box
          as="article"
          display="grid"
          minH={s(170)}
          overflow="hidden"
          rounded={s(16)}
          border={`${s(1)} solid #E2D8FF`}
          bg="#F1ECFF"
          gridTemplateColumns="minmax(0, 1fr) 44%"
        >
          <Stack
            justify="center"
            gap={s(8)}
            minW={0}
            p={{ base: "18px", md: s(24) }}
          >
            <Text
              color="#8B5CF6"
              fontSize={s(11)}
              fontWeight={700}
              letterSpacing={s(0.55)}
              lineHeight={s(16.5)}
              textTransform="uppercase"
            >
              {t("Marketplace.benefitBanners.creditBadge")}
            </Text>
            <Text
              as="h2"
              color="#0F1729"
              fontSize={{ base: "17px", md: s(20) }}
              fontWeight={900}
              lineHeight={{ base: "1.25", md: s(25) }}
              textWrap="balance"
            >
              {t("Marketplace.benefitBanners.creditTitle")}
            </Text>
            <Link href="#marketplace-credit-banner">
              <Text
                color="#8B5CF6"
                fontSize={s(12)}
                fontWeight={700}
                lineHeight={s(18)}
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
            bgImage={CREDIT_GRADIENT}
            px={{ base: "10px", md: s(16) }}
          >
            <Stack
              w="full"
              maxW={s(206)}
              gap={0}
              p={{ base: "12px", md: s(16) }}
              rounded={s(16)}
              bg="white"
              filter={`drop-shadow(0 ${s(20)} ${s(12.5)} rgba(0, 0, 0, 0.1)) drop-shadow(0 ${s(8)} ${s(5)} rgba(0, 0, 0, 0.1))`}
              transform="rotate(-4deg)"
            >
              <Text color="#8A9AB5" fontSize={s(10)} lineHeight={s(15)}>
                {t("Marketplace.benefitBanners.availableLimit")}
              </Text>
              <Text
                color="#0F1729"
                fontSize={{ base: "15px", md: s(18) }}
                fontWeight={900}
                lineHeight={{ base: "24px", md: s(27) }}
                whiteSpace="nowrap"
              >
                {t("Marketplace.benefitBanners.creditAmount")}
              </Text>
              <Box
                mt={s(8)}
                h={s(6)}
                overflow="hidden"
                rounded="full"
                bg="#EEF3FF"
              >
                <Box h="full" w="66.67%" rounded="full" bg="#8B5CF6" />
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
        px={{ base: "20px", md: s(24) }}
        py={{ base: "16px", md: s(20) }}
        rounded={s(16)}
        bgImage={PRO_GRADIENT}
      >
        <Flex
          align={{ base: "flex-start", sm: "center" }}
          gap={{ base: "4px", sm: s(20) }}
          direction={{ base: "column", sm: "row" }}
        >
          <Text
            color="white"
            fontSize={{ base: "22px", md: s(26) }}
            fontWeight={900}
            letterSpacing={s(-0.65)}
            lineHeight={{ base: "30px", md: s(39) }}
            whiteSpace="nowrap"
          >
            neutra+{" "}
            <Text
              as="span"
              fontSize={{ base: "14px", md: s(16) }}
              fontWeight={700}
              letterSpacing={0}
            >
              Pro
            </Text>
          </Text>
          <Text
            color="white"
            fontSize={{ base: "11px", md: s(15) }}
            fontWeight={800}
            letterSpacing={s(0.375)}
            lineHeight={{ base: "17px", md: s(22.5) }}
            textTransform="uppercase"
          >
            {t("Marketplace.benefitBanners.proHeadline")}
          </Text>
        </Flex>
        <Button
          type="button"
          disabled
          h="auto"
          minH={0}
          px={s(20)}
          py={s(10)}
          rounded={s(14)}
          bg="white"
          color="#6D3FE0"
          fontSize={s(13)}
          fontWeight={700}
          lineHeight={s(19.5)}
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
        gap={s(12)}
      >
        {BENEFITS.map((benefit) => {
          const style = BENEFIT_STYLES[benefit.tone];

          return (
            <Flex
              key={benefit.key}
              align="flex-start"
              gap={s(12)}
              minW={0}
              p={s(16)}
              rounded={s(16)}
              border={`${s(1)} solid`}
              borderColor={style.border}
              bg={style.bg}
            >
              <Flex
                align="center"
                justify="center"
                boxSize={s(40)}
                flexShrink={0}
                rounded={s(14)}
                bg="white"
              >
                <Image
                  src={`/images/marketplace/benefits/${benefit.icon}`}
                  alt=""
                  aria-hidden
                  boxSize={s(20)}
                />
              </Flex>
              <Stack gap={s(2)} minW={0}>
                <Text
                  color="#0F1729"
                  fontSize={s(14)}
                  fontWeight={700}
                  lineHeight={s(21)}
                >
                  {t(`Marketplace.benefitBanners.${benefit.titleKey}`)}
                </Text>
                <Text color="#5A6478" fontSize={s(12)} lineHeight={s(18)}>
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
