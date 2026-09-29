"use client";

import { Box, Button, Flex, Grid, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { Trans, useTranslation } from "react-i18next";
import { LuArrowRight, LuShoppingCart } from "react-icons/lu";

import { DashboardHeroProps } from "./interface";

const HERO_GRADIENT =
  "linear-gradient(90deg, #0F1729 0%, #1A2540 50%, #1F5AFF 100%)";

// Saudação pelo horário local do usuário.
function getGreetingKey(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function HighlightCard({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      gap={0}
      w="117.391px"
      px="17px"
      py="13px"
      bg="rgba(255,255,255,0.1)"
      borderWidth="1px"
      borderColor="rgba(255,255,255,0.15)"
      rounded="14px"
    >
      <Text
        truncate
        color="rgba(255,255,255,0.6)"
        fontSize="11px"
        fontWeight={400}
        lineHeight="16.5px"
      >
        {label}
      </Text>
      <Text
        color="white"
        fontSize="16px"
        fontWeight={800}
        lineHeight="24px"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
    </Stack>
  );
}

/**
 * Banner de boas-vindas do início da área autenticada: saudação, resumo das
 * pendências do dia, atalhos principais e os destaques da conta.
 */
export function DashboardHero({ data }: DashboardHeroProps) {
  const { t } = useTranslation();
  const greetingKey = getGreetingKey(new Date().getHours());

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      rounded="16px"
      bgImage={HERO_GRADIENT}
      p={{ base: "24px", md: "32px" }}
    >
      {/* Círculos decorativos */}
      <Box
        position="absolute"
        top="-80px"
        right="-80px"
        boxSize="256px"
        rounded="full"
        bg="rgba(255,255,255,0.05)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="93.5px"
        right="128px"
        boxSize="128px"
        rounded="full"
        bg="rgba(31,90,255,0.3)"
        pointerEvents="none"
      />

      <Flex
        position="relative"
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "flex-start" }}
        justify="space-between"
        gap="24px"
      >
        <Stack gap={0} minW={0}>
          {/* O horário do servidor pode divergir do navegador. */}
          <Text
            suppressHydrationWarning
            color="rgba(255,255,255,0.6)"
            fontSize="14px"
            fontWeight={400}
            lineHeight="21px"
          >
            {t(`Dashboard.hero.greeting.${greetingKey}`)}
          </Text>
          <Text
            as="h1"
            pt="4px"
            color="white"
            fontSize="28px"
            fontWeight={800}
            lineHeight="42px"
          >
            {t("Dashboard.hero.name", { name: data.firstName })}
          </Text>
          <Text
            pt="8px"
            color="rgba(255,255,255,0.7)"
            fontSize="14px"
            fontWeight={400}
            lineHeight="21px"
          >
            <Trans
              i18nKey="Dashboard.hero.summary"
              values={{
                count: data.pendingActions,
                critical: data.criticalSlas,
                proposals: data.awaitingProposals,
              }}
              components={{
                b: <Text as="strong" fontWeight={700} color="white" />,
              }}
            />
          </Text>

          <Flex wrap="wrap" align="center" gap="12px" pt="20px">
            <Button
              asChild
              variant="plain"
              h="auto"
              gap="8px"
              px="12px"
              py="8px"
              bg="white"
              rounded="14px"
              color="#1F5AFF"
              fontSize="13px"
              fontWeight={700}
              lineHeight="19.5px"
              boxShadow="0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)"
              _hover={{ bg: "#F4F6F9" }}
            >
              <NextLink href="/">
                <Icon as={LuShoppingCart} boxSize="14px" />
                {t("Dashboard.hero.exploreMarketplace")}
              </NextLink>
            </Button>
            <Button
              asChild
              variant="plain"
              h="auto"
              gap="8px"
              px="13px"
              py="9px"
              bg="rgba(255,255,255,0.1)"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.2)"
              rounded="14px"
              color="white"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              _hover={{ bg: "rgba(255,255,255,0.18)" }}
            >
              <NextLink href="/search-network">
                {t("Dashboard.hero.searchNetworks")}
                <Icon as={LuArrowRight} boxSize="14px" />
              </NextLink>
            </Button>
          </Flex>
        </Stack>

        {/* Destaques da conta */}
        <Grid templateColumns="repeat(2, 117.391px)" gap="12px" flexShrink={0}>
          <HighlightCard
            label={t("Dashboard.hero.activeOrders")}
            value={data.activeOrders}
          />
          <HighlightCard
            label={t("Dashboard.hero.openRfqs")}
            value={data.openRfqs}
          />
          <HighlightCard
            label={t("Dashboard.hero.credit")}
            value={data.credit}
          />
          <HighlightCard
            label={t("Dashboard.hero.sellerScore")}
            value={`${data.sellerScore} ⭐`}
          />
        </Grid>
      </Flex>
    </Box>
  );
}
