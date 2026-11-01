"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import type { ReturnsSummary } from "@/types/returns";

import { ReturnsStatsProps } from "./interface";

const STATS: { key: keyof ReturnsSummary; color: string }[] = [
  { key: "total", color: "#0F1729" },
  { key: "awaitingAction", color: "#D97706" },
  { key: "contested", color: "#EF4444" },
  { key: "returning", color: "#1F5AFF" },
];

/** Contadores das devoluções do buyer (Figma 2943-31374). */
export function ReturnsStats({ data, locale }: ReturnsStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
      {STATS.map(({ key, color }) => (
        <Stack
          key={key}
          gap="4px"
          p="16px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Text
            truncate
            color="#A0ABB8"
            fontSize="9px"
            fontWeight={700}
            lineHeight="13.5px"
            textTransform="uppercase"
          >
            {t(`Returns.stats.${key}`)}
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
