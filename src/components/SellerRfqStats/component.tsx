"use client";

import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { SellerRfqStatsData, SellerRfqStatsProps } from "./interface";

const STATS: { key: keyof SellerRfqStatsData; color: string }[] = [
  { key: "monthReceived", color: "#0F1729" },
  { key: "pending", color: "#D97706" },
  { key: "withProposal", color: "#1F5AFF" },
  { key: "converted", color: "#10B981" },
  { key: "closed", color: "#8A9AB5" },
];

/** Contadores das RFQs recebidas pelo seller (Figma 2948-52348). */
export function SellerRfqStats({ data, locale }: SellerRfqStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 2, md: 5 }} gap="13px">
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
            fontSize="9px"
            fontWeight={700}
            lineHeight="13.5px"
            letterSpacing="0.45px"
            textTransform="uppercase"
          >
            {t(`SellerOrders.rfq.stats.${key}`)}
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
