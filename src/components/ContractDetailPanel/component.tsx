"use client";

import { Box, Flex, Icon, Text } from "@chakra-ui/react";

import { ContractDetailPanelProps } from "./interface";

/**
 * Painel do detalhe do contrato (Figma 2190-14129): cabeçalho com ícone,
 * título e ações à direita. `sm`: painéis da coluna lateral, sem ícone.
 */
export function ContractDetailPanel({
  title,
  icon,
  iconColor,
  size = "md",
  headerExtra,
  headerAction,
  children,
  ...rest
}: ContractDetailPanelProps) {
  const isSmall = size === "sm";

  return (
    <Box
      as="section"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
      {...rest}
    >
      <Flex
        align="center"
        justify="space-between"
        gap="12px"
        px={isSmall ? "16px" : "20px"}
        py={isSmall ? "12px" : "16px"}
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Flex align="center" gap="8px" minW={0}>
          {icon && (
            <Icon
              as={icon}
              boxSize="14px"
              flexShrink={0}
              color={iconColor}
              aria-hidden
            />
          )}
          <Text
            as="h2"
            color="#0F1729"
            fontSize={isSmall ? "12px" : "13px"}
            fontWeight={700}
            lineHeight={isSmall ? "18px" : "19.5px"}
          >
            {title}
          </Text>
          {headerExtra}
        </Flex>
        {headerAction}
      </Flex>
      {children}
    </Box>
  );
}
