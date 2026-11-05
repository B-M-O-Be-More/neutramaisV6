"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuMapPin, LuRadio, LuZap } from "react-icons/lu";

import { CoverageGlobe } from "./CoverageGlobe";
import { CoverageLocation } from "./CoverageLocation";
import { CoverageMetric } from "./CoverageMetric";
import { CoverageStatus } from "./CoverageStatus";

const COVERAGE_METRICS = [
  { icon: LuMapPin, value: "27", key: "states" },
  { icon: LuRadio, value: "1.9k", key: "cities" },
  { icon: LuZap, value: "<3min", key: "availability" },
] as const;

export function MarketplaceNetworkCoverage() {
  const { t } = useTranslation();

  return (
    <Box
      as="section"
      aria-labelledby="marketplace-network-coverage-title"
      position="relative"
      overflow="hidden"
      minH={{ base: "auto", md: "360px" }}
      bgColor="#F8FAFC"
      borderRadius={"29px"}
      border="1.232px solid #DCE6FA"
      background="linear-gradient(251deg, rgba(139, 92, 246, 0.03) -1.12%, rgba(255, 234, 0, 0.03) 108.49%), linear-gradient(133deg, #F0F5FF 22.03%, #F2F6FF 26.28%, #F4F8FF 30.53%, #F6F9FF 34.78%, #F9FBFF 39.02%, #FBFCFF 43.27%, #FDFEFF 47.52%, #FFF 51.77%, #FCFEFE 56.01%, #FAFEFC 60.26%, #F7FDFB 64.51%, #F5FDF9 68.76%, #F2FCF8 73%, #F0FCF6 77.25%, #EDFBF5 81.5%)"
    >
      <Grid
        minH={{ base: "auto", md: "360px" }}
        templateColumns={{
          base: "1fr",
          md: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
        }}
        alignItems="center"
        gap={{ base: 0, md: "20px", lg: "32px" }}
        px={{ base: "22px", md: "32px", lg: "48px" }}
        py={{ base: "24px", md: "20px", lg: "24px" }}
      >
        <Stack gap="0" maxW="440px" position="relative" zIndex={1}>
          <Flex
            align="center"
            gap="5px"
            w="fit-content"
            mb="13px"
            px="9px"
            py="4px"
            bg="rgba(255, 255, 255, 0.82)"
            border="1px solid #D5E1FF"
            rounded="full"
            color="#1F5AFF"
            fontSize="9px"
            fontWeight={700}
            lineHeight="13px"
            textTransform="uppercase"
          >
            <Icon as={LuMapPin} boxSize="10px" />
            {t("Marketplace.networkCoverage.badge")}
          </Flex>

          <Text
            id="marketplace-network-coverage-title"
            as="h2"
            maxW="390px"
            fontSize={{ base: "24px", md: "26px" }}
            fontWeight={800}
            lineHeight={{ base: "29px", md: "30px" }}
            letterSpacing="-0.5px"
            color="#111827"
          >
            {t("Marketplace.networkCoverage.titlePrefix")}{" "}
            <Text as="span" color="#1F5AFF">
              {t("Marketplace.networkCoverage.providerCount")}
            </Text>{" "}
            <Text as="span" color="#1F5AFF">
              {t("Marketplace.networkCoverage.titleSuffix")}
            </Text>
          </Text>

          <Text
            maxW="390px"
            pt="12px"
            fontSize="11px"
            lineHeight="17px"
            color="#64748B"
          >
            {t("Marketplace.networkCoverage.description")}
          </Text>

          <SimpleGrid columns={3} gap="8px" pt="13px">
            {COVERAGE_METRICS.map((metric) => (
              <CoverageMetric
                key={metric.key}
                icon={metric.icon}
                value={metric.value}
                label={t(`Marketplace.networkCoverage.metrics.${metric.key}`)}
              />
            ))}
          </SimpleGrid>

          <Flex gap="8px" wrap="wrap" pt="22px">
            <Button
              asChild
              h="36px"
              px="14px"
              gap="7px"
              rounded="10px"
              bg="#1F5AFF"
              color="white"
              fontSize="10px"
              fontWeight={700}
              boxShadow="0 4px 8px rgba(31, 90, 255, 0.2)"
              _hover={{ bg: "#1849CC" }}
            >
              <Link href="/register?type=buyer">
                {t("Marketplace.networkCoverage.primaryCta")}
                <Icon as={LuArrowRight} boxSize="13px" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              h="36px"
              px="14px"
              rounded="10px"
              borderColor="#D5E1FF"
              bg="rgba(255, 255, 255, 0.76)"
              color="#1F5AFF"
              fontSize="10px"
              fontWeight={600}
              _hover={{ bg: "white" }}
            >
              <Link href="/search-network">
                {t("Marketplace.networkCoverage.secondaryCta")}
              </Link>
            </Button>
          </Flex>
        </Stack>

        <Box
          position={{ base: "absolute", md: "relative" }}
          top={{ base: "28px", md: "auto" }}
          right={{ base: "-58px", md: "auto" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          w={{ base: "230px", md: "full" }}
          maxW={{ base: "230px", md: "480px", lg: "520px" }}
          minH={{ base: "0", md: "200px", lg: "220px" }}
          opacity={{ base: 0.2, md: 1 }}
          zIndex={0}
          pointerEvents="none"
        >
          <Box display={{ base: "none", md: "block" }}>
            <CoverageStatus />
          </Box>
          <CoverageGlobe />
          <Box display={{ base: "none", md: "block" }}>
            <CoverageLocation />
          </Box>
        </Box>
      </Grid>
    </Box>
  );
}
