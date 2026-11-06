"use client";

import { Icon, Stack, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";

import { s } from "./scale";

interface CoverageMetricProps {
  icon: IconType;
  value: string;
  label: string;
}

export function CoverageMetric({ icon, value, label }: CoverageMetricProps) {
  return (
    <Stack
      gap={0}
      minW={0}
      p={s(12)}
      bg="white"
      border="1px solid #E5E8EE"
      rounded={s(14)}
    >
      <Icon as={icon} boxSize={s(16)} flexShrink={0} color="#1F5AFF" />
      <Text
        pt={s(6)}
        fontSize={s(20)}
        fontWeight={800}
        lineHeight={s(30)}
        color="#0F1729"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
      <Text
        minW={0}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        fontSize={s(11)}
        lineHeight={s(16.5)}
        color="#8A9AB5"
      >
        {label}
      </Text>
    </Stack>
  );
}
