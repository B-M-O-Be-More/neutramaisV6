"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import type { BuyerOrdersSummary } from "@/functions/buyerOrders";

import { BuyerOrdersStatsProps } from "./interface";

const STATS: { key: keyof BuyerOrdersSummary; color: string }[] = [
  { key: "total", color: "#0F1729" },
  { key: "inProgress", color: "#1F5AFF" },
  { key: "inEscrow", color: "#10B981" },
  { key: "inCancellation", color: "#EF4444" },
];

/** Indicadores de "Meus Pedidos", no mesmo visual da fila do seller. */
export function BuyerOrdersStats({ data, locale }: BuyerOrdersStatsProps) {
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
            {t(`BuyerOrders.stats.${key}`)}
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
