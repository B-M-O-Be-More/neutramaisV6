"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleCheckBig,
  LuCircleX,
  LuClock,
  LuPenLine,
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
    key: "awaitingSignature",
    icon: LuPenLine,
    iconSize: "16px",
    iconColor: "#D97706",
    color: "#D97706",
    bg: "rgba(210, 153, 34, 0.09)",
  },
  {
    key: "processing",
    icon: LuClock,
    iconSize: "16px",
    iconColor: "#1F5AFF",
    color: "#1F5AFF",
    bg: "#EEF3FF",
  },
  {
    key: "signed",
    icon: LuCircleCheckBig,
    iconSize: "16px",
    iconColor: "#10B981",
    color: "#10B981",
    bg: "#EDFBF5",
  },
  {
    key: "cancelled",
    icon: LuCircleX,
    iconSize: "16px",
    iconColor: "#9AAABF",
    color: "#5A6478",
    bg: "rgba(154, 170, 191, 0.21)",
  },
];

/** Contadores dos contratos do buyer, pelo status da assinatura. */
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
