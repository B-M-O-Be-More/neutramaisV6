"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { LuStore } from "react-icons/lu";

import { CartSellerGroupProps } from "./interface";

/**
 * Itens de um seller no carrinho (Figma 2879-94537): cada seller vira um
 * pedido no checkout, com o próprio subtotal.
 */
export function CartSellerGroup({
  title,
  badge,
  children,
  countLabel,
  subtotalLabel,
}: CartSellerGroupProps) {
  return (
    <Stack
      as="section"
      aria-label={title}
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        gap="12px"
        px="20px"
        py="14px"
        bg="#FBFCFE"
        borderBottomWidth="1px"
        borderColor="#E5E8EE"
      >
        <Flex align="center" gap="10px" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="32px"
            flexShrink={0}
            bg="white"
            borderWidth="1px"
            borderColor="#DCE2EC"
            rounded="8px"
          >
            <Icon as={LuStore} boxSize="14px" color="#1F5AFF" aria-hidden />
          </Flex>
          <Text
            as="h2"
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
            truncate
          >
            {title}
          </Text>
        </Flex>
        {badge && (
          <Text
            as="span"
            flexShrink={0}
            px="10px"
            py="4px"
            rounded="full"
            bg="#EEF3FF"
            color="#1F5AFF"
            fontSize="11px"
            fontWeight={700}
            lineHeight="16.5px"
          >
            {badge}
          </Text>
        )}
      </Flex>

      <Box as="ul" listStyleType="none" mb="-1px">
        {children}
      </Box>

      {(countLabel || subtotalLabel) && (
        <Flex
          align="center"
          justify="space-between"
          gap="12px"
          px="20px"
          py="12px"
          bg="#FBFCFE"
          borderTopWidth="1px"
          borderColor="#F0F2F7"
        >
          <Text
            color="#6F7B90"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {countLabel}
          </Text>
          <Text
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {subtotalLabel}
          </Text>
        </Flex>
      )}
    </Stack>
  );
}
