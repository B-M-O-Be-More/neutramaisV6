"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";

import { WalletHintProps, WalletHintTone } from "./interface";

const TONES: Record<
  WalletHintTone,
  { bg: string; border: string; title: string; text: string }
> = {
  blue: { bg: "#EEF3FF", border: "#C7D8FF", title: "#1F5AFF", text: "#5A7CE0" },
  purple: {
    bg: "#F3EEFF",
    border: "#D3BFFD",
    title: "#8B5CF6",
    text: "#5B21B6",
  },
  amber: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    title: "#D97706",
    text: "#92400E",
  },
  green: {
    bg: "#EDFBF5",
    border: "#AAECD5",
    title: "#10B981",
    text: "#10B981",
  },
};

/**
 * Faixa informativa da carteira: o aviso "Sobre o saque de crédito" e as
 * dicas dos cards (pagamento combinado, PIX para payout, segurança do cartão).
 */
export function WalletHint({
  tone,
  title,
  description,
  icon,
  size = "inline",
}: WalletHintProps) {
  const colors = TONES[tone];
  const isNotice = size === "notice";

  return (
    <Flex
      gap={isNotice ? "12px" : "8px"}
      align={title ? "flex-start" : "center"}
      px={isNotice ? "20px" : "12px"}
      py={isNotice ? "16px" : "12px"}
      bg={colors.bg}
      borderWidth="1px"
      borderColor={colors.border}
      rounded={isNotice ? "14px" : "10px"}
    >
      {icon && (
        <Icon
          as={icon}
          boxSize={isNotice ? "16px" : "13px"}
          mt={title ? "2px" : 0}
          color={colors.title}
          flexShrink={0}
        />
      )}
      <Stack gap="2px" minW={0}>
        {title && (
          <Text
            color={colors.title}
            fontSize={isNotice ? "13px" : "12px"}
            fontWeight={600}
            lineHeight={isNotice ? "19.5px" : "18px"}
          >
            {title}
          </Text>
        )}
        <Text
          color={title ? colors.text : colors.title}
          fontSize={isNotice || !title ? "12px" : "11px"}
          lineHeight={isNotice || !title ? "18px" : "16.5px"}
        >
          {description}
        </Text>
      </Stack>
    </Flex>
  );
}
