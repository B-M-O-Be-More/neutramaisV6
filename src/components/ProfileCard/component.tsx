"use client";

import { Flex, Stack, Text } from "@chakra-ui/react";

import { ProfileCardProps } from "./interface";

/** Card das abas do Meu Perfil (Figma 2205-18442): título e conteúdo. */
export function ProfileCard({
  title,
  titleEnd,
  tone = "default",
  children,
}: ProfileCardProps) {
  const isDanger = tone === "danger";

  return (
    <Stack
      as="section"
      gap="16px"
      p="24px"
      bg={isDanger ? "#FEF2F2" : "white"}
      borderWidth="1px"
      borderColor={isDanger ? "#FECACA" : "#E5E8EE"}
      rounded="14px"
      minW={0}
    >
      <Flex align="center" justify="space-between" gap="12px">
        <Text
          as="h2"
          color={isDanger ? "#EF4444" : "#0F1729"}
          fontSize={isDanger ? "13px" : "15px"}
          fontWeight={700}
          lineHeight={isDanger ? "19.5px" : "22.5px"}
        >
          {title}
        </Text>
        {titleEnd}
      </Flex>
      {children}
    </Stack>
  );
}
