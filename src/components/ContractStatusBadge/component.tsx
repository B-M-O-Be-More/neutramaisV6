"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { CONTRACT_STATUS_STYLES } from "@/data/contractStatus";

import { ContractStatusBadgeProps } from "./interface";

/** Selo do status do contrato (card da lista e cabeçalho do detalhe). */
export function ContractStatusBadge({
  status,
  size = "sm",
}: ContractStatusBadgeProps) {
  const { t } = useTranslation();
  const style = CONTRACT_STATUS_STYLES[status];
  const isLarge = size === "md";

  return (
    <Flex
      align="center"
      gap="6px"
      px="12px"
      py={isLarge ? "6px" : "4px"}
      bg={style.bg}
      rounded={isLarge ? "14px" : "10px"}
      color={style.color}
      flexShrink={0}
    >
      <Icon as={style.icon} boxSize={isLarge ? "13px" : "11px"} aria-hidden />
      <Text
        fontSize={isLarge ? "13px" : "12px"}
        fontWeight={isLarge ? 700 : 600}
        lineHeight={isLarge ? "19.5px" : "18px"}
        whiteSpace="nowrap"
      >
        {t(`Contracts.statuses.${status}`)}
      </Text>
    </Flex>
  );
}
