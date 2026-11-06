"use client";

import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { s } from "./scale";

// Banner "Crédito Neutra+" do Figma (Neutra+ MP, nó 3300:59465): card roxo de
// 990×363 e a arte do escrow de 483×363 lado a lado, com a mesma altura. Os
// valores abaixo são o Figma ÷ 1,2316; a partir de 1536px a variável
// --credit-s devolve o valor 1:1.
export function MarketplaceCreditBanner() {
  const { t } = useTranslation();

  return (
    <Box
      id="marketplace-credit-banner"
      as="section"
      aria-labelledby="marketplace-credit-banner-title"
      css={{
        "--credit-s": "1",
        "@media (min-width: 1536px)": { "--credit-s": "1.2316" },
      }}
    >
      <Grid
        alignItems="stretch"
        gap={{ base: "16px", md: s(20) }}
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "minmax(0, 990fr) minmax(0, 483fr)",
        }}
      >
        <Box
          position="relative"
          minH={{ base: "390px", md: "auto" }}
          overflow="hidden"
          rounded={{ base: "24px", md: s(24) }}
          bgImage="linear-gradient(90deg, #7C3AED 0%, #4F46E5 100%)"
        >
          {/* Círculo decorativo: 288px a 69% da largura e 29% da altura. */}
          <Box
            aria-hidden
            position="absolute"
            top={{ base: "100px", md: "29.5%" }}
            left={{ base: "auto", md: "69.2%" }}
            right={{ base: "-112px", md: "auto" }}
            boxSize={{ base: "260px", md: s(288) }}
            rounded="full"
            bg="rgba(255, 255, 255, 0.1)"
          />

          <Stack
            position="relative"
            zIndex={1}
            align="flex-start"
            justify="center"
            h="full"
            gap={0}
            maxW={{ base: "100%", md: s(484) }}
            p={{ base: "24px", md: s(36) }}
            pb={{ base: "142px", md: s(36) }}
          >
            <Flex
              align="center"
              gap={{ base: "6px", md: s(6) }}
              h={{ md: s(24.5) }}
              mb={{ base: "12px", md: s(16) }}
              px={{ base: "11px", md: s(12) }}
              py={{ base: "4px", md: s(4) }}
              rounded="full"
              bg="rgba(255, 255, 255, 0.15)"
              color="white"
            >
              <Image
                src="/images/marketplace/credit-sparkles.svg"
                alt=""
                aria-hidden
                boxSize={{ base: "12px", md: s(12) }}
                flexShrink={0}
              />
              <Text
                fontSize={{ base: "9px", md: s(11) }}
                fontWeight={700}
                lineHeight={{ base: "16px", md: s(16.5) }}
                whiteSpace="nowrap"
              >
                {t("Marketplace.creditBanner.badge")}
              </Text>
            </Flex>

            <Text
              id="marketplace-credit-banner-title"
              as="h2"
              maxW="full"
              color="white"
              fontSize={{ base: "24px", md: s(26) }}
              fontWeight={800}
              lineHeight={{ base: "29px", md: s(29.9) }}
              textWrap="balance"
            >
              {t("Marketplace.creditBanner.title")}
            </Text>

            <Text
              maxW="full"
              mt={{ base: "10px", md: s(12) }}
              color="rgba(255, 255, 255, 0.8)"
              fontSize={{ base: "12px", md: s(13) }}
              lineHeight={{ base: "19px", md: s(20.8) }}
            >
              {t("Marketplace.creditBanner.description")}
            </Text>

            <Button
              asChild
              mt={{ base: "18px", md: s(24) }}
              h={{ base: "42px", md: s(45) }}
              px={{ base: "18px", md: s(24) }}
              gap={{ base: "8px", md: s(8) }}
              rounded={{ base: "13px", md: s(14) }}
              bg="white"
              color="#4F46E5"
              fontSize={{ base: "12px", md: s(14) }}
              fontWeight={700}
              lineHeight={{ base: "20px", md: s(21) }}
              _hover={{ bg: "#F5F3FF" }}
            >
              <Link href="/register?type=buyer">
                {t("Marketplace.creditBanner.cta")}
                <Image
                  src="/images/marketplace/credit-arrow-right.svg"
                  alt=""
                  aria-hidden
                  boxSize={{ base: "14px", md: s(15) }}
                  flexShrink={0}
                />
              </Link>
            </Button>
          </Stack>

          {/* Cartão de vidro: 240×144, girado -6°, a 64,8% da largura e 21,5%
              da altura do card. */}
          <Box
            position="absolute"
            top={{ base: "auto", md: "21.5%" }}
            left={{ base: "auto", md: "64.8%" }}
            right={{ base: "14px", md: "auto" }}
            bottom={{ base: "16px", md: "auto" }}
            zIndex={1}
            display="flex"
            h={{ base: "116px", md: s(144) }}
            w={{ base: "184px", md: s(240) }}
            flexDirection="column"
            alignItems="flex-start"
            p={{ base: "14px", md: s(20) }}
            rounded={{ base: "16px", md: s(16) }}
            border="1px solid rgba(255, 255, 255, 0.3)"
            bg="rgba(255, 255, 255, 0.15)"
            backdropFilter="blur(8px)"
            transform="rotate(-6deg)"
          >
            <Image
              src="/images/marketplace/credit-wallet.svg"
              alt=""
              aria-hidden
              boxSize={{ base: "20px", md: s(22) }}
              flexShrink={0}
            />
            <Text
              mt={{ base: "8px", md: s(24) }}
              color="rgba(255, 255, 255, 0.7)"
              fontSize={{ base: "9px", md: s(11) }}
              lineHeight={{ base: "16px", md: s(16.5) }}
            >
              {t("Marketplace.creditBanner.availableLimit")}
            </Text>
            <Text
              color="white"
              fontSize={{ base: "20px", md: s(24) }}
              fontWeight={800}
              lineHeight={{ base: "28px", md: s(36) }}
              whiteSpace="nowrap"
            >
              {t("Marketplace.creditBanner.limitValue")}
            </Text>
          </Box>
        </Box>

        <Box
          position="relative"
          w="full"
          overflow="hidden"
          rounded={{ base: "24px", md: s(24) }}
          aspectRatio="482.77 / 363.16"
        >
          <Image
            src="/images/marketplace/escrow-protection.png"
            alt={t("Marketplace.creditBanner.escrowAlt")}
            w="full"
            h="full"
            objectFit="cover"
          />
        </Box>
      </Grid>
    </Box>
  );
}
