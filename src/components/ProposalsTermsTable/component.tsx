"use client";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { ProposalsTermsTableProps } from "./interface";

/**
 * Condições de uma proposta em linhas rótulo/valor (Figma 2063-31358): preço,
 * SLA, prazos, política de cancelamento. Também resume a RFQ enviada.
 */
export function ProposalsTermsTable({
  title,
  subtitle,
  rows,
  footer,
  footerTone = "muted",
  density = "comfortable",
}: ProposalsTermsTableProps) {
  const isCompact = density === "compact";

  return (
    <Box
      bg={isCompact ? "#F8F9FB" : "white"}
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      {title && (
        <Stack
          gap={0}
          px="20px"
          pt="12px"
          pb="13px"
          bg="#F8F9FB"
          borderBottomWidth="1px"
          borderColor="#E5E8EE"
        >
          <Text
            color="#0F1729"
            fontSize="14px"
            fontWeight={700}
            lineHeight="21px"
          >
            {title}
          </Text>
          {subtitle && (
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {subtitle}
            </Text>
          )}
        </Stack>
      )}

      <Box as="dl">
        {rows.map((row, index) => (
          <Flex
            key={row.key}
            justify="space-between"
            align="flex-start"
            gap="16px"
            px="20px"
            pt={isCompact ? "12px" : "14px"}
            pb={isCompact ? "13px" : "15px"}
            borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
            borderColor="#F4F6F9"
          >
            <Text
              as="dt"
              flexShrink={0}
              color="#8A9AB5"
              fontSize="12px"
              lineHeight="18px"
            >
              {row.label}
            </Text>
            <Text
              as="dd"
              minW={0}
              color="#0F1729"
              fontSize={isCompact ? "12px" : "13px"}
              fontWeight={600}
              lineHeight={isCompact ? "18px" : "19.5px"}
              textAlign="end"
              overflowWrap="anywhere"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>

      {footer && (
        <Flex
          justify="space-between"
          align="center"
          gap="12px"
          wrap="wrap"
          px="20px"
          pt="13px"
          pb="12px"
          bg={footerTone === "accent" ? "#EEF3FF" : "#F8F9FB"}
          borderTopWidth="1px"
          borderColor={footerTone === "accent" ? "#EEF3FF" : "#E5E8EE"}
          color={footerTone === "accent" ? "#1F5AFF" : "#A0ABB8"}
          fontSize={footerTone === "accent" ? "12px" : "11px"}
          fontWeight={footerTone === "accent" ? 700 : 400}
          lineHeight={footerTone === "accent" ? "18px" : "16.5px"}
        >
          {footer}
        </Flex>
      )}
    </Box>
  );
}
