"use client";

import { Flex, Icon, Skeleton, Stack, Text } from "@chakra-ui/react";
import { LuTrendingUp } from "react-icons/lu";

import { MarketplaceStatCardProps } from "./interface";

/**
 * Card genérico de métrica da home do marketplace.
 * Recebe rótulo, valor, legenda e cor de destaque — é reaproveitado por todas
 * as métricas da faixa abaixo do banner.
 */
export function MarketplaceStatCard({
  label,
  value,
  caption,
  accentColor,
  icon = LuTrendingUp,
  isLoading = false,
}: MarketplaceStatCardProps) {
  return (
    <Stack
      gap="6px"
      p="21px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex align="center" gap="8px" pb="4px">
        <Icon as={icon} boxSize="12px" color={accentColor} flexShrink={0} />
        <Text
          fontSize="10px"
          fontWeight={700}
          lineHeight="15px"
          letterSpacing="0.5px"
          textTransform="uppercase"
          color="#A0ABB8"
        >
          {label}
        </Text>
      </Flex>

      {isLoading ? (
        <Skeleton h="26px" w="120px" rounded="6px" />
      ) : (
        <Text
          fontSize="26px"
          fontWeight={800}
          lineHeight="26px"
          color={accentColor}
        >
          {value}
        </Text>
      )}

      <Text fontSize="11px" lineHeight="16.5px" color="#A0ABB8">
        {caption}
      </Text>
    </Stack>
  );
}
