"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import type { TicketsSummary } from "@/types/tickets";

import { TicketsStatsProps } from "./interface";

const STATS: { key: keyof TicketsSummary; color: string }[] = [
  { key: "open", color: "#D97706" },
  { key: "critical", color: "#EF4444" },
  { key: "resolvedThisMonth", color: "#10B981" },
  { key: "presale", color: "#8B5CF6" },
];

/** Contadores dos tickets (Figma 3108-101514). */
export function TicketsStats({ data, locale }: TicketsStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
      {STATS.map(({ key, color }) => (
        <Stack
          key={key}
          gap="8px"
          px="20px"
          py="16px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Text
            truncate
            color="#A0ABB8"
            fontSize="10px"
            fontWeight={700}
            lineHeight="15px"
            letterSpacing="0.5px"
            textTransform="uppercase"
          >
            {t(`Tickets.stats.${key}`)}
          </Text>
          <Text
            color={color}
            fontSize="26px"
            fontWeight={800}
            lineHeight="39px"
          >
            {format(data[key])}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
