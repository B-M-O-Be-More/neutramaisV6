"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { LuShieldCheck } from "react-icons/lu";

import CopyValueButton from "@/components/CopyValueButton";

import { OrderInfoCardProps } from "./interface";

/**
 * Seção da coluna principal do detalhe do pedido (Figma 2191-17877): título
 * com ícone, linhas "rótulo · valor" e um rodapé cinza com ações ou nota.
 */
export function OrderInfoCard({
  icon,
  iconColor,
  title,
  rows = [],
  children,
  actions,
  note,
}: OrderInfoCardProps) {
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
      <Flex
        align="center"
        gap="8px"
        px="20px"
        py="16px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Icon as={icon} boxSize="14px" color={iconColor} aria-hidden />
        <Text
          as="h2"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {title}
        </Text>
      </Flex>

      {rows.length > 0 && (
        <Box as="dl">
          {rows.map((row, index) => (
            <Flex
              key={row.key}
              align="center"
              justify="space-between"
              gap="16px"
              px="16px"
              py="12px"
              borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
              borderColor="#F4F6F9"
            >
              <Text
                as="dt"
                color="#8A9AB5"
                fontSize="12px"
                lineHeight="18px"
                flexShrink={0}
              >
                {row.label}
              </Text>
              <Flex as="dd" align="center" gap="8px" minW={0}>
                <Text
                  color="#0F1729"
                  fontSize="12px"
                  fontWeight={600}
                  lineHeight="18px"
                  textAlign="right"
                  wordBreak="break-word"
                >
                  {row.value}
                </Text>
                {row.copyValue && (
                  <CopyValueButton value={row.copyValue} label={row.label} />
                )}
              </Flex>
            </Flex>
          ))}
        </Box>
      )}

      {children}

      {actions && (
        <Flex
          gap="8px"
          wrap="wrap"
          px="20px"
          py="12px"
          bg="#F8F9FB"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          {actions}
        </Flex>
      )}

      {note && (
        <Flex
          gap="10px"
          align="flex-start"
          px="20px"
          py="16px"
          bg="#F8F9FB"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Icon
            as={LuShieldCheck}
            boxSize="12px"
            mt="2px"
            flexShrink={0}
            color="#8A9AB5"
            aria-hidden
          />
          <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
            {note}
          </Text>
        </Flex>
      )}
    </Stack>
  );
}
