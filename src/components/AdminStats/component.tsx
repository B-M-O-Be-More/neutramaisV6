"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuClock, LuGavel, LuTrendingUp, LuUsers } from "react-icons/lu";

import { AdminStatsProps } from "./interface";

interface StatItem {
  key: "activeSellers" | "kycQueue" | "volume30d" | "openDisputes";
  icon: IconType;
  color: string;
}

const STATS: StatItem[] = [
  { key: "activeSellers", icon: LuUsers, color: "#8B5CF6" },
  { key: "kycQueue", icon: LuClock, color: "#D97706" },
  { key: "volume30d", icon: LuTrendingUp, color: "#1F5AFF" },
  { key: "openDisputes", icon: LuGavel, color: "#EF4444" },
];

/** Indicadores do topo do painel administrativo (Figma 2593-78105). */
export function AdminStats({ data }: AdminStatsProps) {
  const { t } = useTranslation();

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="16px">
      {STATS.map((stat) => {
        const value = data[stat.key];
        return (
          <Stack
            key={stat.key}
            gap="12px"
            px="20px"
            py="16px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
          >
            <Flex align="center" gap="8px">
              <Icon as={stat.icon} boxSize="14px" color={stat.color} />
              <Text
                color="#A0ABB8"
                fontSize="10px"
                fontWeight={700}
                lineHeight="15px"
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                {t(`Admin.stats.${stat.key}`)}
              </Text>
            </Flex>
            <Text
              color={stat.color}
              fontSize="26px"
              fontWeight={800}
              lineHeight="39px"
              whiteSpace="nowrap"
            >
              {value ?? "—"}
            </Text>
          </Stack>
        );
      })}
    </SimpleGrid>
  );
}
