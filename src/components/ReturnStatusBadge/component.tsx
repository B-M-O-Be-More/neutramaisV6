"use client";

import { Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { RETURN_STATUS_STYLES } from "@/data/returnStatus";

import { ReturnStatusBadgeProps } from "./interface";

/** Status da devolução: `sm` no card da lista, `md` no detalhe. */
export function ReturnStatusBadge({
  status,
  size = "sm",
}: ReturnStatusBadgeProps) {
  const { t } = useTranslation();
  const colors = RETURN_STATUS_STYLES[status];
  const isSmall = size === "sm";

  return (
    <Text
      as="span"
      display="inline-block"
      px={isSmall ? "8px" : "12px"}
      py={isSmall ? "2px" : "6px"}
      bg={colors.bg}
      rounded="8px"
      color={colors.color}
      fontSize={isSmall ? "10px" : "11px"}
      fontWeight={700}
      lineHeight={isSmall ? "15px" : "16.5px"}
      whiteSpace="nowrap"
    >
      {t(`Returns.statuses.${status}`)}
    </Text>
  );
}
