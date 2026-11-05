"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { SellerOrdersStatsData, SellerOrdersStatsProps } from "./interface";

const STATS: { key: keyof SellerOrdersStatsData; color: string }[] = [
  { key: "monthTotal", color: "#0F1729" },
  { key: "awaiting", color: "#D97706" },
  { key: "accepted", color: "#10B981" },
  { key: "withIssue", color: "#EF4444" },
];

/** Contadores da fila de pedidos do seller (Figma 2948-51152). */
export function SellerOrdersStats({ data, locale }: SellerOrdersStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
      {STATS.map(({ key, color }) => (
        <Stack
          key={key}
          gap="4px"
          px="16px"
          py="12px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Text
            color="#A0ABB8"
            fontSize="9.5px"
            fontWeight={700}
            lineHeight="14.25px"
            letterSpacing="0.475px"
            textTransform="uppercase"
          >
            {t(`SellerOrders.stats.${key}`)}
          </Text>
          <Text
            color={color}
            fontSize="22px"
            fontWeight={800}
            lineHeight="33px"
          >
            {format(data[key])}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
