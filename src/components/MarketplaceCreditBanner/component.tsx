"use client";

import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function MarketplaceCreditBanner() {
  const { t } = useTranslation();

  return (
    <Box
      id="marketplace-credit-banner"
      as="section"
      aria-labelledby="marketplace-credit-banner-title"
    >
      <Grid
        alignItems="center"
        gap={{ base: "16px", md: "20px" }}
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "minmax(0, 2.05fr) minmax(0, 1fr)",
        }}
      >
        <Box
          position="relative"
          minH={{ base: "390px", md: "auto" }}
          overflow="hidden"
          rounded="24px"
          bgImage="linear-gradient(90deg, #7C3AED 0%, #4F46E5 100%)"
        >
          <Box
            aria-hidden
            position="absolute"
            top={{ base: "100px", md: "82px" }}
            right={{ base: "-112px", md: "-86px" }}
            boxSize={{ base: "260px", md: "278px" }}
            rounded="full"
            bg="rgba(255, 255, 255, 0.1)"
          />

          <Stack
            position="relative"
            zIndex={1}
            align="flex-start"
            gap={0}
            maxW={{ base: "100%", md: "58%" }}
            p={{ base: "24px", md: "32px" }}
            pb={{ base: "142px", md: "32px" }}
          >
            <Flex
              align="center"
              gap="6px"
              mb={{ base: "12px", md: "11px" }}
              px={{ base: "11px", md: "12px" }}
              py="4px"
              rounded="full"
              bg="rgba(255, 255, 255, 0.15)"
              color="white"
            >
              <Image
                src="/images/marketplace/credit-sparkles.svg"
                alt=""
                aria-hidden
                boxSize={{ base: "12px", md: "14.8px" }}
                flexShrink={0}
              />
              <Text
                fontSize={{ base: "9px", md: "10px" }}
                fontWeight={700}
                lineHeight="16px"
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
              fontSize={{ base: "24px", md: "24px" }}
              fontWeight={800}
              lineHeight={{ base: "29px", md: "27px" }}
              letterSpacing="-0.4px"
            >
              {t("Marketplace.creditBanner.title")}
            </Text>

            <Text
              maxW="full"
              mt={{ base: "10px", md: "11px" }}
              color="rgba(255, 255, 255, 0.8)"
              fontSize={{ base: "12px", md: "12px" }}
              lineHeight={{ base: "19px", md: "19px" }}
            >
              {t("Marketplace.creditBanner.description")}
            </Text>

            <Button
              asChild
              mt={{ base: "18px", md: "22px" }}
              h={{ base: "42px", md: "40px" }}
              px={{ base: "18px", md: "22px" }}
              gap="8px"
              rounded="13px"
              bg="white"
              color="#4F46E5"
              fontSize={{ base: "12px", md: "12.5px" }}
              fontWeight={700}
              lineHeight="20px"
              _hover={{ bg: "#F5F3FF" }}
            >
              <Link href="/register?type=buyer">
                {t("Marketplace.creditBanner.cta")}
                <Image
                  src="/images/marketplace/credit-arrow-right.svg"
                  alt=""
                  aria-hidden
                  boxSize={{ base: "14px", md: "18.5px" }}
                  flexShrink={0}
                />
              </Link>
            </Button>
          </Stack>

          <Box
            position="absolute"
            top={{ base: "auto", md: "21.5%" }}
            right={{ base: "14px", md: "3.7%" }}
            bottom={{ base: "16px", md: "auto" }}
            zIndex={1}
            display="flex"
            h={{ base: "116px", md: "129px" }}
            w={{ base: "184px", md: "30.5%" }}
            flexDirection="column"
            alignItems="flex-start"
            p={{ base: "14px", md: "18px" }}
            rounded="16px"
            border="1px solid rgba(255, 255, 255, 0.3)"
            bg="rgba(255, 255, 255, 0.15)"
            backdropFilter="blur(8px)"
            transform="rotate(-6deg)"
          >
            <Image
              src="/images/marketplace/credit-wallet.svg"
              alt=""
              aria-hidden
              boxSize={{ base: "20px", md: "21px" }}
              flexShrink={0}
            />
            <Text
              mt={{ base: "8px", md: "18px" }}
              color="rgba(255, 255, 255, 0.7)"
              fontSize={{ base: "9px", md: "10px" }}
              lineHeight="16px"
            >
              {t("Marketplace.creditBanner.availableLimit")}
            </Text>
            <Text
              color="white"
              fontSize={{ base: "20px", md: "22px" }}
              fontWeight={800}
              lineHeight={{ base: "28px", md: "32px" }}
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
          rounded="24px"
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
