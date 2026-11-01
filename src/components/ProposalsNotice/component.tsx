"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import { LuCircleAlert, LuCircleCheck, LuInfo } from "react-icons/lu";

import { ProposalsNoticeProps, ProposalsNoticeTone } from "./interface";

const TONES: Record<
  ProposalsNoticeTone,
  { bg: string; border: string; accent: string; text: string; icon: IconType }
> = {
  info: {
    bg: "#EEF3FF",
    border: "#C7D8FF",
    accent: "#1F5AFF",
    text: "#1E3A8A",
    icon: LuInfo,
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    accent: "#D97706",
    text: "#92400E",
    icon: LuCircleAlert,
  },
  danger: {
    bg: "#FEF2F2",
    border: "#FECACA",
    accent: "#EF4444",
    text: "#991B1B",
    icon: LuCircleAlert,
  },
  success: {
    bg: "#EDFBF5",
    border: "#AAECD5",
    accent: "#10B981",
    text: "#065F46",
    icon: LuCircleCheck,
  },
  // Regras da caixa de entrada do seller (Figma 2948-52374).
  seller: {
    bg: "#F3EEFF",
    border: "#D3BFFD",
    accent: "#8B5CF6",
    text: "#5B21B6",
    icon: LuInfo,
  },
};

/**
 * Aviso dos fluxos de proposta e RFQ: revisão gera nova versão, RFQ não pode
 * ser editada após o envio, cancelamento notifica o seller etc.
 */
export function ProposalsNotice({
  tone,
  title,
  children,
  size = "dialog",
  icon,
  action,
}: ProposalsNoticeProps) {
  const colors = TONES[tone];
  const isPage = size === "page";
  // A faixa informativa da página (Figma 2073-38612) tem texto azul claro e
  // ícone de 15px. Nos demais, com título o ícone acompanha o título (16px);
  // só texto, 13px.
  const isInfoPage = isPage && tone === "info";
  const iconSize = isInfoPage ? "15px" : title ? "16px" : "13px";

  return (
    <Flex
      gap={title ? "12px" : "10px"}
      align="flex-start"
      px={isPage ? "21px" : "17px"}
      py={title ? "17px" : "15px"}
      bg={colors.bg}
      borderWidth="1px"
      borderColor={colors.border}
      rounded="14px"
    >
      <Icon
        as={icon ?? colors.icon}
        boxSize={iconSize}
        mt={title ? "2px" : "2.5px"}
        flexShrink={0}
        color={colors.accent}
        aria-hidden
      />
      <Stack gap="2px" flex="1" minW={0}>
        {title && (
          <Text
            color={colors.accent}
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {title}
          </Text>
        )}
        <Text
          color={isInfoPage ? "#5A7CE0" : colors.text}
          fontSize="12px"
          lineHeight="18px"
        >
          {children}
        </Text>
      </Stack>
      {action && <Box flexShrink={0}>{action}</Box>}
    </Flex>
  );
}
