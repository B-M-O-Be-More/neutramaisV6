"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";

import { ProposalStatusBadgeProps } from "./interface";

const SIZES = {
  sm: { px: "10px", py: "2px", fontSize: "11px", lineHeight: "16.5px" },
  md: { px: "12px", py: "4px", fontSize: "12px", lineHeight: "18px" },
  lg: { px: "12px", py: "6px", fontSize: "12px", lineHeight: "18px" },
} as const;

/** Selo de status de uma proposta ou RFQ. */
export function ProposalStatusBadge({
  status,
  label,
  size = "sm",
}: ProposalStatusBadgeProps) {
  const metrics = SIZES[size];

  return (
    <Flex
      align="center"
      gap="6px"
      px={metrics.px}
      py={metrics.py}
      bg={status.bg}
      rounded="10px"
      flexShrink={0}
    >
      {size !== "lg" && (
        <Icon as={status.icon} boxSize="11px" color={status.color} />
      )}
      <Text
        color={status.color}
        fontSize={metrics.fontSize}
        fontWeight={600}
        lineHeight={metrics.lineHeight}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
  );
}
