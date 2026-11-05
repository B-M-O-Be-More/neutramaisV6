"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";

interface CoverageMetricProps {
  icon: IconType;
  value: string;
  label: string;
}

export function CoverageMetric({ icon, value, label }: CoverageMetricProps) {
  return (
    <Stack
      gap="2px"
      minW={0}
      minH="65px"
      p="14px"
      bg="rgba(255, 255, 255, 0.9)"
      border="1px solid #E1E7F0"
      rounded="12px"
      boxShadow="0 4px 12px rgba(15, 23, 41, 0.03)"
    >
      <Flex align="center" gap="5px" color="#1F5AFF">
        <Icon as={icon} boxSize="19px" flexShrink={0} />

      </Flex>
      <Text fontSize="24px" fontWeight={800} lineHeight="36px" color="#0F1729">
        {value}
      </Text>
      <Text
        minW={0}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        fontSize="13px"
        fontWeight={400}
        lineHeight="13px"
        color="#8A9AB5
"
      >
        {label}
      </Text>
    </Stack>
  );
}
