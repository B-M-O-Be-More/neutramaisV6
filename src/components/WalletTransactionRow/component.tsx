"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuCircleCheck,
  LuClock,
} from "react-icons/lu";

import type { WalletTransactionStatus } from "@/functions/walletTransactions";

import { WalletTransactionRowProps, WalletTransactionTone } from "./interface";

const TONES: Record<
  WalletTransactionTone,
  { icon: IconType; color: string; iconBg: string; amount: string }
> = {
  credit: {
    icon: LuArrowDownLeft,
    color: "#10B981",
    iconBg: "#EDFBF5",
    amount: "#10B981",
  },
  debit: {
    icon: LuArrowUpRight,
    color: "#EF4444",
    iconBg: "#FEF2F2",
    amount: "#EF4444",
  },
  escrow: {
    icon: LuClock,
    color: "#D97706",
    iconBg: "#FFFBEB",
    amount: "#D97706",
  },
  release: {
    icon: LuCircleCheck,
    color: "#8B5CF6",
    iconBg: "#F3EEFF",
    amount: "#1F5AFF",
  },
};

const STATUS: Record<
  WalletTransactionStatus,
  { color: string; bg: string; border: string }
> = {
  completed: { color: "#10B981", bg: "#EDFBF5", border: "#AAECD5" },
  pending: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  failed: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

/** Lançamento da carteira (Figma 2250-22201 e 2208-36642). */
export function WalletTransactionRow({
  tone,
  title,
  date,
  reference,
  amount,
  status,
  size = "compact",
  isLast = false,
}: WalletTransactionRowProps) {
  const { t } = useTranslation();
  const colors = TONES[tone];
  const isRegular = size === "regular";

  return (
    <Flex
      align="center"
      gap="12px"
      py={isRegular ? "16px" : "12px"}
      px={isRegular ? "20px" : 0}
      borderBottomWidth={isLast ? 0 : "1px"}
      borderColor="#F4F6F9"
    >
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        flexShrink={0}
        bg={colors.iconBg}
        rounded="10px"
      >
        <Icon as={colors.icon} boxSize="14px" color={colors.color} />
      </Flex>

      <Stack gap="2px" flex="1" minW={0}>
        <Text
          color="#0F1729"
          fontSize={isRegular ? "13px" : "12px"}
          fontWeight={600}
          lineHeight={isRegular ? "19.5px" : "18px"}
          truncate
        >
          {title}
        </Text>
        <Flex gap="8px" color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
          <Text>{date}</Text>
          {reference && (
            <>
              <Text color="#C4CDD8" aria-hidden>
                ·
              </Text>
              <Text truncate>{reference}</Text>
            </>
          )}
        </Flex>
      </Stack>

      {status && (
        <Box
          flexShrink={0}
          px="8px"
          py="2px"
          bg={STATUS[status].bg}
          borderWidth="1px"
          borderColor={STATUS[status].border}
          rounded="8px"
          color={STATUS[status].color}
          fontSize="10px"
          fontWeight={600}
          lineHeight="15px"
        >
          {t(`Wallet.transactions.status.${status}`)}
        </Box>
      )}

      <Text
        flexShrink={0}
        color={colors.amount}
        fontSize={isRegular ? "14px" : "13px"}
        fontWeight={700}
        lineHeight="21px"
        textAlign="right"
      >
        {amount}
      </Text>
    </Flex>
  );
}
