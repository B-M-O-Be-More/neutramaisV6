"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { LuSearch, LuZap } from "react-icons/lu";

import { SearchNetworkHeroProps } from "./interface";

const HERO_GRADIENT =
  "linear-gradient(165.89deg, #0F1729 0%, #1A2540 50%, #1F5AFF 100%)";

// Atalhos de busca abaixo do campo, na ordem do design.
const QUICK_FILTERS = [
  "fiber",
  "dedicatedLink",
  "colocation",
  "ip",
  "cpeHardware",
] as const;

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Stack
      gap={0}
      align="center"
      px="20px"
      py="15px"
      bg="rgba(255,255,255,0.1)"
      borderWidth="1px"
      borderColor="rgba(255,255,255,0.15)"
      rounded="16px"
      textAlign="center"
    >
      <Text
        color="white"
        fontSize="20.75px"
        fontWeight={800}
        lineHeight="31.125px"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
      <Text
        truncate
        maxW="full"
        color="rgba(255,255,255,0.6)"
        fontSize="11.5px"
        lineHeight="17.3px"
      >
        {label}
      </Text>
    </Stack>
  );
}

/**
 * Banner da busca de redes: chamada, campo de busca por região/produto/seller,
 * atalhos por categoria e os números da plataforma.
 */
export function SearchNetworkHero({
  detectedNetworks,
  stats,
  query,
  onQueryChange,
  onSearch,
}: SearchNetworkHeroProps) {
  const { t } = useTranslation();

  // O Flex renderiza um <form>, mas o Chakra tipa o evento como de <div>.
  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  const handleQuickFilter = (label: string) => {
    onQueryChange(label);
    onSearch(label);
  };

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      rounded="16px"
      bgImage={HERO_GRADIENT}
      px={{ base: "20px", md: "32px" }}
      pt={{ base: "24px", md: "32px" }}
      pb="20px"
    >
      {/* Círculos decorativos */}
      <Box
        position="absolute"
        top="-128px"
        right="-128px"
        boxSize="384px"
        rounded="full"
        bg="rgba(31,90,255,0.2)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="129.69px"
        left="50%"
        boxSize="256px"
        rounded="full"
        bg="rgba(139,92,246,0.15)"
        pointerEvents="none"
      />

      <Flex
        position="relative"
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "flex-start" }}
        gap="24px"
      >
        <Stack flex="1" minW={0} gap={0}>
          <Flex pb="14px">
            <Flex
              align="center"
              gap="8px"
              px="13px"
              py="5px"
              rounded="full"
              bg="rgba(255,255,255,0.1)"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.2)"
            >
              <Icon as={LuZap} boxSize="11px" color="white" />
              <Text
                color="white"
                fontSize="11px"
                fontWeight={700}
                lineHeight="16.5px"
                textTransform="uppercase"
              >
                {t("SearchNetwork.hero.detected", { count: detectedNetworks })}
              </Text>
            </Flex>
          </Flex>

          <Text
            as="h1"
            color="white"
            fontSize="28px"
            fontWeight={800}
            lineHeight="33.6px"
          >
            <Trans
              i18nKey="SearchNetwork.hero.title"
              components={{
                hl: <Text as="span" color="#578CFD" />,
                br: <br />,
              }}
            />
          </Text>
          <Text pt="8px" color="#C9D1D9" fontSize="14px" lineHeight="21px">
            {t("SearchNetwork.hero.subtitle")}
          </Text>

          <Flex
            as="form"
            onSubmit={handleSubmit}
            role="search"
            direction={{ base: "column", sm: "row" }}
            gap="8px"
            pt="20px"
            maxW="661px"
          >
            <InputGroup
              flex="1"
              startElement={
                <Icon
                  as={LuSearch}
                  boxSize="15px"
                  color="rgba(255,255,255,0.4)"
                />
              }
              startElementProps={{ ps: "14px" }}
            >
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                aria-label={t("SearchNetwork.hero.searchLabel")}
                placeholder={t("SearchNetwork.hero.searchPlaceholder")}
                h="47px"
                ps="41px"
                pe="17px"
                bg="rgba(255,255,255,0.1)"
                borderWidth="1px"
                borderColor="rgba(255,255,255,0.2)"
                rounded="14px"
                color="white"
                fontSize="14px"
                _placeholder={{ color: "rgba(255,255,255,0.4)" }}
                _focusVisible={{
                  borderColor: "rgba(255,255,255,0.5)",
                  outline: "none",
                }}
              />
            </InputGroup>
            <Button
              type="submit"
              variant="plain"
              h="47px"
              px="12px"
              bg="#1646CC"
              rounded="14px"
              color="white"
              fontSize="15px"
              fontWeight={700}
              lineHeight="22.5px"
              boxShadow="0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)"
              _hover={{ bg: "#123AAB" }}
            >
              {t("SearchNetwork.hero.submit")}
            </Button>
          </Flex>
        </Stack>

        {/* Números da plataforma */}
        <Grid
          templateColumns={{
            base: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(2, 139.8px)",
          }}
          gap="9px"
          flexShrink={0}
        >
          <StatCard
            value={stats.verifiedSellers}
            label={t("SearchNetwork.hero.stats.verifiedSellers")}
          />
          <StatCard
            value={stats.averageSla}
            label={t("SearchNetwork.hero.stats.averageSla")}
          />
          <StatCard
            value={stats.categories}
            label={t("SearchNetwork.hero.stats.categories")}
          />
          <StatCard
            value={stats.nearbyNetworks}
            label={t("SearchNetwork.hero.stats.nearbyNetworks")}
          />
        </Grid>
      </Flex>

      {/* Atalhos por categoria */}
      <Flex position="relative" wrap="wrap" gap="8px" pt="16px">
        {QUICK_FILTERS.map((key) => {
          const label = t(`SearchNetwork.hero.quickFilters.${key}`);
          return (
            <Button
              key={key}
              type="button"
              variant="plain"
              h="auto"
              px="13px"
              py="7px"
              rounded="full"
              bg="rgba(255,255,255,0.1)"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.2)"
              color="white"
              fontSize="12px"
              fontWeight={400}
              lineHeight="18px"
              _hover={{ bg: "rgba(255,255,255,0.18)" }}
              onClick={() => handleQuickFilter(label)}
            >
              {label}
            </Button>
          );
        })}
      </Flex>
    </Box>
  );
}
