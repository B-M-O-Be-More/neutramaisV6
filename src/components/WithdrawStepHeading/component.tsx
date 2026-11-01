"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";

import { WithdrawStepHeadingProps } from "./interface";

/** Ícone, título e subtítulo de cada etapa do saque (Figma 2215-24045). */
export function WithdrawStepHeading({
  icon,
  title,
  subtitle,
  tone = "default",
}: WithdrawStepHeadingProps) {
  const isIdentity = tone === "identity";

  return (
    <Stack align="center" gap="0" textAlign="center">
      <Flex
        align="center"
        justify="center"
        boxSize="56px"
        bg={isIdentity ? "rgba(31,90,255,0.08)" : "#EEF3FF"}
        borderWidth="1px"
        borderColor={isIdentity ? "#6499FF" : "#C7D8FF"}
        rounded="16px"
      >
        <Icon as={icon} boxSize="24px" color="#1F5AFF" />
      </Flex>
      <Text
        as="h1"
        pt="16px"
        color="#0F1729"
        fontSize="24px"
        fontWeight={800}
        lineHeight="36px"
      >
        {title}
      </Text>
      <Text pt="4px" color="#8A9AB5" fontSize="14px" lineHeight="21px">
        {subtitle}
      </Text>
    </Stack>
  );
}
