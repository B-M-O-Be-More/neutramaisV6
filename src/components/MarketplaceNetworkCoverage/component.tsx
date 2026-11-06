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
import {
  LuArrowRight,
  LuMapPin,
  LuNetwork,
  LuRadio,
  LuZap,
} from "react-icons/lu";

import { CoverageGlobe } from "./CoverageGlobe";
import { CoverageLocation } from "./CoverageLocation";
import { CoverageMetric } from "./CoverageMetric";
import { CoverageStatus } from "./CoverageStatus";
import { s } from "./scale";

const COVERAGE_METRICS = [
  { icon: LuNetwork, value: "27", key: "states" },
  { icon: LuRadio, value: "1.9k", key: "cities" },
  { icon: LuZap, value: "<3min", key: "availability" },
] as const;

// Medidas do Figma (Neutra+ MP, nó 3300:58976). A partir de 1536px a seção
// usa os valores do Figma 1:1 (--cov-s = 1,2316 sobre a base escrita aqui);
// abaixo disso, a mesma proporção reduzida.
export function MarketplaceNetworkCoverage() {
  const { t } = useTranslation();

  return (
    <Box
      as="section"
      aria-labelledby="marketplace-network-coverage-title"
      position="relative"
      overflow="hidden"
      css={{
        "--cov-s": "1",
        "@media (min-width: 1536px)": { "--cov-s": "1.2316" },
      }}
      borderRadius={s(24)}
      border="1px solid #DCE6FA"
      bgColor="#F8FAFC"
      background="linear-gradient(239deg, rgba(139, 92, 246, 0.025) 1.12%, rgba(255, 234, 0, 0.025) 108.49%), linear-gradient(149deg, #F0F5FF 22.03%, #F2F6FF 26.28%, #F4F8FF 30.53%, #F6F9FF 34.78%, #F9FBFF 39.02%, #FBFCFF 43.27%, #FDFEFF 47.52%, #FFF 51.77%, #FCFEFE 56.01%, #FAFEFC 60.26%, #F7FDFB 64.51%, #F5FDF9 68.76%, #F2FCF8 73%, #F0FCF6 77.25%, #EDFBF5 81.5%)"
    >
      <Grid
        minH={{ base: "auto", md: s(520), lg: s(696) }}
        templateColumns={{
          base: "1fr",
          md: "minmax(0, 1fr) minmax(0, 1fr)",
          lg: "minmax(0, 0.84fr) minmax(0, 1fr)",
        }}
        alignItems="stretch"
      >
        <Stack
          gap={{ base: s(24), lg: s(32) }}
          justify="center"
          position="relative"
          zIndex={1}
          minW={0}
          py={{ base: s(28), md: s(40) }}
          pl={{ base: s(22), md: s(40), lg: s(72) }}
          pr={{ base: s(22), md: "0" }}
        >
          <Stack gap={s(20)} maxW={s(436)}>
            <Flex
              align="center"
              gap={s(6)}
              w="fit-content"
              px={s(12)}
              py={s(4)}
              bg="white"
              border="1px solid #C7D8FF"
              rounded="full"
              color="#1F5AFF"
              fontSize={s(11)}
              fontWeight={700}
              lineHeight={s(16.5)}
              textTransform="uppercase"
            >
              <Icon as={LuMapPin} boxSize={s(12)} />
              {t("Marketplace.networkCoverage.badge")}
            </Flex>

            <Text
              id="marketplace-network-coverage-title"
              as="h2"
              maxW={{ base: s(406), lg: s(350) }}
              fontSize={{ base: s(26), md: s(28), lg: s(32) }}
              fontWeight={800}
              lineHeight={{ base: s(30), md: s(32), lg: s(36) }}
              color="#0F1729"
            >
              {t("Marketplace.networkCoverage.titlePrefix")}{" "}
              <Text as="span" color="#1F5AFF">
                {t("Marketplace.networkCoverage.providerCount")}{" "}
                {t("Marketplace.networkCoverage.titleSuffix")}
              </Text>
            </Text>

            <Text
              maxW={s(406)}
              fontSize={s(14)}
              lineHeight={s(22.4)}
              color="#5A6478"
            >
              {t("Marketplace.networkCoverage.description")}
            </Text>

            <SimpleGrid columns={3} gap={s(12)} maxW={s(406)}>
              {COVERAGE_METRICS.map((metric) => (
                <CoverageMetric
                  key={metric.key}
                  icon={metric.icon}
                  value={metric.value}
                  label={t(`Marketplace.networkCoverage.metrics.${metric.key}`)}
                />
              ))}
            </SimpleGrid>
          </Stack>

          <Flex gap={s(12)} wrap="wrap">
            <Button
              asChild
              h="auto"
              px={s(24)}
              py={s(14)}
              gap={s(8)}
              rounded={s(14)}
              bg="#1F5AFF"
              color="white"
              fontSize={s(14)}
              fontWeight={700}
              lineHeight={s(21)}
              boxShadow="0 4px 3px rgba(0, 0, 0, 0.1), 0 2px 2px rgba(0, 0, 0, 0.1)"
              _hover={{ bg: "#1849CC" }}
            >
              <Link href="/register?type=buyer">
                {t("Marketplace.networkCoverage.primaryCta")}
                <Icon as={LuArrowRight} boxSize={s(15)} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              h="auto"
              px={s(20)}
              py={s(14)}
              rounded={s(14)}
              borderColor="#C7D8FF"
              bg="white"
              color="#1F5AFF"
              fontSize={s(14)}
              fontWeight={600}
              lineHeight={s(21)}
              _hover={{ bg: "#F5F8FF" }}
            >
              <Link href="/search-network">
                {t("Marketplace.networkCoverage.secondaryCta")}
              </Link>
            </Button>
          </Flex>
        </Stack>

        <Box
          position={{ base: "absolute", md: "relative" }}
          top={{ base: s(28), md: "auto" }}
          right={{ base: s(-58), md: "auto" }}
          w={{ base: s(230), md: "full" }}
          h={{ base: s(230), md: "auto" }}
          minH={{ base: "0", md: s(520), lg: s(696) }}
          opacity={{ base: 0.2, md: 1 }}
          zIndex={0}
          pointerEvents="none"
        >
          <CoverageGlobe />
          <Box display={{ base: "none", md: "block" }}>
            <CoverageStatus />
            <CoverageLocation />
          </Box>
        </Box>
      </Grid>
    </Box>
  );
}
