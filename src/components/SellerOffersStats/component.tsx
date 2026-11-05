"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuChartNoAxesColumn,
  LuEye,
  LuPackage,
  LuTrendingUp,
} from "react-icons/lu";

import { SellerOffersStatsProps } from "./interface";

interface StatItem {
  key: "totalOffers" | "views" | "orders" | "revenue";
  icon: IconType;
  color: string;
  iconBg: string;
  iconBorder: string;
}

const STATS: StatItem[] = [
  {
    key: "totalOffers",
    icon: LuPackage,
    color: "#8B5CF6",
    iconBg: "#F3EEFF",
    iconBorder: "#D3BFFD",
  },
  {
    key: "views",
    icon: LuEye,
    color: "#1F5AFF",
    iconBg: "#EEF3FF",
    iconBorder: "#C7D8FF",
  },
  {
    key: "orders",
    icon: LuTrendingUp,
    color: "#10B981",
    iconBg: "#EDFBF5",
    iconBorder: "#AAECD5",
  },
  {
    key: "revenue",
    icon: LuChartNoAxesColumn,
    color: "#10B981",
    iconBg: "#EDFBF5",
    iconBorder: "#AAECD5",
  },
];

/** Indicadores do topo do catálogo do seller (Figma 2073-41614). */
export function SellerOffersStats({ data }: SellerOffersStatsProps) {
  const { t } = useTranslation();

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="16px">
      {STATS.map((stat) => {
        const caption = stat.key === "totalOffers" ? data.totalCaption : null;
        return (
          <Stack
            key={stat.key}
            gap="12px"
            p="21px"
            minH="169px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="16px"
          >
            <Flex
              align="center"
              justify="center"
              boxSize="40px"
              bg={stat.iconBg}
              borderWidth="1px"
              borderColor={stat.iconBorder}
              rounded="14px"
            >
              <Icon as={stat.icon} boxSize="18px" color={stat.color} />
            </Flex>
            <Stack gap={0}>
              <Text
                color="#8A9AB5"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {t(`SellerOffers.stats.${stat.key}`)}
              </Text>
              <Text
                pt="4px"
                color={stat.color}
                fontSize="26px"
                fontWeight={800}
                lineHeight="26px"
                whiteSpace="nowrap"
              >
                {data[stat.key] ?? "—"}
              </Text>
              {caption && (
                <Text
                  pt="12px"
                  color="#A0ABB8"
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {caption}
                </Text>
              )}
            </Stack>
          </Stack>
        );
      })}
    </SimpleGrid>
  );
}
