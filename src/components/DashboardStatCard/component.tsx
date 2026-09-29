"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";

import { DashboardStatCardProps } from "./interface";

/**
 * Card de indicador do início da área autenticada: ícone em destaque à
 * esquerda e rótulo, valor e legenda empilhados.
 */
export function DashboardStatCard({
  label,
  value,
  caption,
  icon,
  accentColor,
}: DashboardStatCardProps) {
  return (
    <Flex
      align="flex-start"
      gap="12px"
      px="21px"
      py="17px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Flex
        boxSize="36px"
        align="center"
        justify="center"
        bg="#F8F9FB"
        rounded="14px"
        flexShrink={0}
      >
        <Icon as={icon} boxSize="14px" color={accentColor} />
      </Flex>

      <Stack gap={0} minW={0}>
        <Text
          truncate
          color="#A0ABB8"
          fontSize="9px"
          fontWeight={700}
          lineHeight="13.5px"
          letterSpacing="0.45px"
          textTransform="uppercase"
        >
          {label}
        </Text>
        <Text
          pt="4px"
          color={accentColor}
          fontSize="20px"
          fontWeight={800}
          lineHeight="30px"
          whiteSpace="nowrap"
        >
          {value}
        </Text>
        <Text truncate color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          {caption}
        </Text>
      </Stack>
    </Flex>
  );
}
