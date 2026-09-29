"use client";

import { Box, Flex, Icon, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import { LuStar, LuStore } from "react-icons/lu";

import { DashboardSellerPerformanceProps } from "./interface";

const CARD_GRADIENT = "linear-gradient(149.93deg, #8B5CF6 0%, #A78BFA 100%)";
const MAX_RATING = 5;

function MetricBar({ label, value }: { label: string; value: number }) {
  const percent = Math.min(Math.max(value, 0), 100);

  return (
    <Stack gap="2px">
      <Flex justify="space-between" fontSize="10px" lineHeight="15px">
        <Text opacity={0.8}>{label}</Text>
        <Text fontWeight={700}>{percent}%</Text>
      </Flex>
      <Box
        h="6px"
        rounded="full"
        bg="rgba(255,255,255,0.2)"
        overflow="hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Box h="full" w={`${percent}%`} rounded="full" bg="white" />
      </Box>
    </Stack>
  );
}

/** Card roxo com a reputação e os indicadores de entrega do seller. */
export function DashboardSellerPerformance({
  data,
  reportHref,
}: DashboardSellerPerformanceProps) {
  const { t } = useTranslation();
  // Estrelas cheias só para pontos inteiros — 4.8 exibe 4 cheias e 1 vazia.
  const filledStars = Math.floor(data.rating);

  return (
    <Stack
      as="section"
      gap={0}
      p="20px"
      rounded="14px"
      bgImage={CARD_GRADIENT}
      color="white"
    >
      <Flex align="center" gap="8px">
        <Icon as={LuStore} boxSize="14px" color="rgba(255,255,255,0.8)" />
        <Text as="h3" fontSize="12px" fontWeight={700} lineHeight="18px">
          {t("Dashboard.sellerPerformance.title")}
        </Text>
      </Flex>

      <Flex align="baseline" gap="6px" pt="12px">
        <Text fontSize="28px" fontWeight={800} lineHeight="42px">
          {data.rating.toFixed(1)}
        </Text>
        <Text fontSize="14px" lineHeight="21px" opacity={0.7}>
          / {MAX_RATING.toFixed(1)}
        </Text>
      </Flex>

      <Flex
        align="center"
        gap="4px"
        pt="4px"
        aria-label={t("Dashboard.sellerPerformance.ratingLabel", {
          rating: data.rating.toFixed(1),
          max: MAX_RATING,
        })}
      >
        {Array.from({ length: MAX_RATING }, (_, index) => (
          <Icon
            key={index}
            as={LuStar}
            boxSize="12px"
            aria-hidden
            color={index < filledStars ? "white" : "rgba(255,255,255,0.3)"}
            fill={index < filledStars ? "white" : "none"}
          />
        ))}
        <Text pl="4px" fontSize="11px" lineHeight="16.5px" opacity={0.75}>
          {t("Dashboard.sellerPerformance.reviews", {
            count: data.reviewCount,
          })}
        </Text>
      </Flex>

      <Stack gap="6px" pt="12px">
        <MetricBar
          label={t("Dashboard.sellerPerformance.acceptanceSla")}
          value={data.acceptanceSla}
        />
        <MetricBar
          label={t("Dashboard.sellerPerformance.onTimeDelivery")}
          value={data.onTimeDelivery}
        />
      </Stack>

      <Box pt="12px">
        <Link
          asChild
          display="inline-flex"
          px="12px"
          py="8px"
          color="rgba(255,255,255,0.8)"
          fontSize="11px"
          fontWeight={600}
          lineHeight="16.5px"
          _hover={{ color: "white" }}
        >
          <NextLink href={reportHref}>
            {t("Dashboard.sellerPerformance.fullReport")}
          </NextLink>
        </Link>
      </Box>
    </Stack>
  );
}
