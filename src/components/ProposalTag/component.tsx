"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";

import { ProposalTagProps, ProposalTagTone } from "./interface";

const TONES: Record<
  ProposalTagTone,
  { bg: string; border: string; color: string }
> = {
  green: { bg: "#EDFBF5", border: "#AAECD5", color: "#10B981" },
  blue: { bg: "#EEF3FF", border: "#C7D8FF", color: "#1F5AFF" },
  amber: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706" },
  red: { bg: "#FEF2F2", border: "#FECACA", color: "#EF4444" },
};

/** Etiqueta pequena ao lado do nome: KYC, versão, mensagem do seller... */
export function ProposalTag({
  tone,
  label,
  icon,
  size = "sm",
}: ProposalTagProps) {
  const colors = TONES[tone];
  const isMedium = size === "md";

  return (
    <Flex
      align="center"
      gap="4px"
      px={isMedium ? "9px" : "8px"}
      py={isMedium ? "3px" : "2px"}
      bg={colors.bg}
      borderWidth="1px"
      borderColor={colors.border}
      rounded="8px"
      flexShrink={0}
    >
      {icon && <Icon as={icon} boxSize="9px" color={colors.color} />}
      <Text
        color={colors.color}
        fontSize={isMedium && !icon ? "10px" : "9px"}
        fontWeight={700}
        lineHeight={isMedium && !icon ? "15px" : "13.5px"}
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
  );
}
