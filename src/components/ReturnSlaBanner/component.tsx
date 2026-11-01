"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuClock } from "react-icons/lu";

import { isReturnSlaUrgent } from "@/functions/returnSla";

import { ReturnSlaBannerProps } from "./interface";

/**
 * Prazo de atendimento do seller no detalhe: vermelho quando está acabando
 * (Figma 2943-31520), âmbar nos demais (Figma 2943-31633).
 */
export function ReturnSlaBanner({ hours }: ReturnSlaBannerProps) {
  const { t } = useTranslation();
  const isUrgent = isReturnSlaUrgent(hours);

  return (
    <Flex
      role="status"
      align="center"
      gap="8px"
      px="16px"
      py="12px"
      bg={isUrgent ? "#FEF2F2" : "#FFFBEB"}
      borderWidth="1px"
      borderColor={isUrgent ? "#FECACA" : "#FDE68A"}
      rounded="12px"
      color={isUrgent ? "#EF4444" : "#D97706"}
    >
      <Icon as={LuClock} boxSize="14px" flexShrink={0} aria-hidden />
      <Text fontSize="12px" fontWeight={700} lineHeight="18px">
        {t("Returns.detail.sla", { count: hours })}
      </Text>
    </Flex>
  );
}
