"use client";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { OrderSideCardProps } from "./interface";

/**
 * Card da coluna lateral do detalhe do pedido ("Resumo do pedido", "Valor do
 * pedido" — Figma 2191-18120): linhas compactas e um total opcional.
 */
export function OrderSideCard({ title, rows }: OrderSideCardProps) {
  return (
    <Stack
      as="section"
      aria-label={title}
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Text
        as="h2"
        px="16px"
        py="12px"
        color="#0F1729"
        fontSize="12px"
        fontWeight={700}
        lineHeight="18px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        {title}
      </Text>
      <Box as="dl">
        {rows.map((row, index) => (
          <Flex
            key={row.key}
            align="center"
            justify="space-between"
            gap="12px"
            px="16px"
            py="10px"
            bg={row.emphasis ? "#F8F9FB" : undefined}
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
          >
            <Text
              as="dt"
              color={row.emphasis ? "#0F1729" : "#A0ABB8"}
              fontSize="11px"
              fontWeight={row.emphasis ? 700 : 400}
              lineHeight="16.5px"
              flexShrink={0}
            >
              {row.label}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize={row.emphasis ? "14px" : "11px"}
              fontWeight={row.emphasis ? 800 : 600}
              lineHeight={row.emphasis ? "21px" : "16.5px"}
              textAlign="right"
              truncate
              minW={0}
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>
    </Stack>
  );
}
