"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuChartNoAxesColumn,
  LuCircleAlert,
  LuFileText,
  LuRotateCcw,
} from "react-icons/lu";

import type { ContractsSummary } from "@/types/contracts";

import { ContractsStatsProps } from "./interface";

const STATS: {
  key: keyof ContractsSummary;
  icon: IconType;
  iconSize: string;
  iconColor: string;
  color: string;
  bg: string;
}[] = [
  {
    key: "active",
    icon: LuFileText,
    iconSize: "16px",
    iconColor: "#8B5CF6",
    color: "#8B5CF6",
    bg: "#F3EEFF",
  },
  {
    key: "renewing",
    icon: LuRotateCcw,
    iconSize: "16px",
    iconColor: "#D97706",
    color: "#F1BF00",
    bg: "rgba(210, 153, 34, 0.09)",
  },
  {
    key: "suspended",
    icon: LuCircleAlert,
    iconSize: "15px",
    iconColor: "#EF4444",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.2)",
  },
  {
    key: "changeRequests",
    icon: LuChartNoAxesColumn,
    iconSize: "18px",
    iconColor: "#9AAABF",
    color: "#5A6478",
    bg: "rgba(154, 170, 191, 0.21)",
  },
];

/** Contadores dos contratos do buyer (Figma 2084-13505). */
export function ContractsStats({ data, locale }: ContractsStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16px">
      {STATS.map(({ key, icon, iconSize, iconColor, color, bg }) => (
        <Stack
          key={key}
          gap="12px"
          p="21px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="16px"
        >
          <Flex
            boxSize="40px"
            align="center"
            justify="center"
            bg={bg}
            borderWidth="0.2px"
            borderColor={color}
            rounded="14px"
          >
            <Icon as={icon} boxSize={iconSize} color={iconColor} aria-hidden />
          </Flex>

          <Stack gap="4px" minW={0}>
            <Text
              truncate
              color="#8A9AB5"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
            >
              {t(`Contracts.stats.${key}`)}
            </Text>
            <Text
              color={color}
              fontSize="26px"
              fontWeight={800}
              lineHeight="26px"
            >
              {format(data[key])}
            </Text>
          </Stack>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
