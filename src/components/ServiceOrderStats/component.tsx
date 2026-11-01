"use client";

import { Box, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuInfo,
  LuPackage,
} from "react-icons/lu";

import { Tooltip } from "@/components/ui/tooltip";
import type { ServiceOrdersSummary } from "@/types/serviceOrders";

import { ServiceOrderStatsProps } from "./interface";

const STATS: {
  key: keyof ServiceOrdersSummary;
  icon: IconType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "total",
    icon: LuPackage,
    color: "#1F5AFF",
    bg: "#EEF3FF",
    border: "#C7D8FF",
  },
  {
    key: "inProgress",
    icon: LuCircleCheck,
    color: "#10B981",
    bg: "#EDFBF5",
    border: "#AAECD5",
  },
  {
    key: "awaiting",
    icon: LuClock,
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    key: "withIssue",
    icon: LuCircleAlert,
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
];

/**
 * Contadores das ordens de serviço e das demandas (Figma 2191-24647): ícone no
 * tom do indicador, "ⓘ" com a explicação, rótulo e valor.
 */
export function ServiceOrderStats({
  data,
  scope,
  locale,
}: ServiceOrderStatsProps) {
  const { t } = useTranslation();
  const format = new Intl.NumberFormat(locale).format;

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap="16px">
      {STATS.map(({ key, icon, color, bg, border }) => {
        const label = t(`ServiceOrders.stats.${key}`);
        const hint = t(`ServiceOrders.stats.hints.${scope}.${key}`);
        return (
          <Stack
            key={key}
            gap="12px"
            p="20px"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="16px"
          >
            <Flex justify="space-between" align="flex-start">
              <Flex
                align="center"
                justify="center"
                boxSize="40px"
                bg={bg}
                borderWidth="1px"
                borderColor={border}
                rounded="14px"
                aria-hidden
              >
                <Icon as={icon} boxSize="18px" color={color} />
              </Flex>
              <Tooltip content={hint} showArrow>
                <Box
                  asChild
                  display="flex"
                  mt="4px"
                  color="#A0ABB8"
                  rounded="full"
                  cursor="help"
                  _hover={{ color: "#5A6478" }}
                >
                  <button type="button" aria-label={hint}>
                    <Icon as={LuInfo} boxSize="14px" />
                  </button>
                </Box>
              </Tooltip>
            </Flex>
            <Stack gap="4px">
              <Text
                color="#8A9AB5"
                fontSize="12px"
                fontWeight={600}
                lineHeight="18px"
              >
                {label}
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
        );
      })}
    </SimpleGrid>
  );
}
