"use client";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { ORDER_STAGE_TONES } from "@/data/orderStageTones";
import { orderStageTone } from "@/functions/orderStage";

import { OrderStatusCardProps } from "./interface";

/** "Status atual" no topo da coluna lateral (Figma 2191-18112). */
export function OrderStatusCard({ stage, caption }: OrderStatusCardProps) {
  const { t } = useTranslation();
  const tone = ORDER_STAGE_TONES[orderStageTone(stage)];

  return (
    <Stack
      as="section"
      aria-label={t("OrderDetail.status.title")}
      gap={0}
      p="16px"
      bg={tone.bg}
      borderWidth="1px"
      borderColor={tone.border}
      rounded="14px"
    >
      <Text
        color="#5A6478"
        fontSize="11px"
        fontWeight={600}
        lineHeight="16.5px"
        letterSpacing="0.66px"
        textTransform="uppercase"
      >
        {t("OrderDetail.status.title")}
      </Text>
      <Flex align="center" gap="8px" pt="8px">
        <Box boxSize="10px" rounded="full" bg={tone.accent} flexShrink={0} />
        <Text
          color={tone.accent}
          fontSize="15px"
          fontWeight={800}
          lineHeight="22.5px"
        >
          {t(`OrderDetail.stages.${stage}`)}
        </Text>
      </Flex>
      <Text pt="6px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
        {caption}
      </Text>
    </Stack>
  );
}
