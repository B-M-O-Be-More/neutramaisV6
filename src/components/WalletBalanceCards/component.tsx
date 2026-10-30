"use client";

import {
  Badge,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuClock,
  LuInfo,
  LuLock,
  LuShield,
  LuTrendingUp,
  LuWallet,
  LuWalletCards,
} from "react-icons/lu";

import { Tooltip } from "@/components/ui/tooltip";

import { WalletBalanceCardsProps, WalletIndicator } from "./interface";

interface Tone {
  color: string;
  iconBg: string;
  iconBorder: string;
}

const GREEN: Tone = {
  color: "#10B981",
  iconBg: "#EDFBF5",
  iconBorder: "#AAECD5",
};
const AMBER: Tone = {
  color: "#D97706",
  iconBg: "#FFFBEB",
  iconBorder: "#FDE68A",
};
const PURPLE: Tone = {
  color: "#8B5CF6",
  iconBg: "#F3EEFF",
  iconBorder: "#D3BFFD",
};
const RED: Tone = {
  color: "#EF4444",
  iconBg: "#FEF2F2",
  iconBorder: "#FECACA",
};
const BLUE: Tone = {
  color: "#1F5AFF",
  iconBg: "#EEF3FF",
  iconBorder: "#C7D8FF",
};

const MAIN = [
  { key: "available", icon: LuWallet, tone: GREEN },
  { key: "escrow", icon: LuClock, tone: AMBER },
  { key: "dispute", icon: LuLock, tone: PURPLE },
] as const;

const SUMMARY = [
  { key: "monthCredited", icon: LuArrowDownLeft, tone: GREEN },
  { key: "monthSpent", icon: LuArrowUpRight, tone: RED },
  { key: "escrowNow", icon: LuTrendingUp, tone: AMBER },
] as const;

const CARD = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
} as const;

function Value({
  indicator,
  color,
}: {
  indicator: WalletIndicator;
  color: string;
}) {
  if (indicator.isLoading) return <Skeleton h="26px" w="140px" rounded="8px" />;
  return (
    <Text
      color={indicator.value ? color : "#A0ABB8"}
      fontSize="26px"
      fontWeight={800}
      lineHeight="26px"
    >
      {indicator.value ?? "—"}
    </Text>
  );
}

function SummaryHeader({
  icon,
  tone,
  label,
}: {
  icon: IconType;
  tone: Tone;
  label: string;
}) {
  return (
    <Flex align="center" gap="8px">
      <Flex
        align="center"
        justify="center"
        boxSize="32px"
        flexShrink={0}
        bg={tone.iconBg}
        rounded="10px"
      >
        <Icon as={icon} boxSize="15px" color={tone.color} />
      </Flex>
      <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
        {label}
      </Text>
    </Flex>
  );
}

/**
 * Indicadores da carteira (Figma 2250-22061 e 2250-22120): saldo, escrow e
 * disputa no topo; crédito Neutra+ e o movimento do mês abaixo.
 */
export function WalletBalanceCards({ data }: WalletBalanceCardsProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="16px">
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px">
        {MAIN.map(({ key, icon, tone }) => (
          <Stack key={key} {...CARD} rounded="16px" gap="12px" p="20px">
            <Flex align="flex-start" justify="space-between">
              <Flex
                align="center"
                justify="center"
                boxSize="40px"
                bg={tone.iconBg}
                borderWidth="1px"
                borderColor={tone.iconBorder}
                rounded="14px"
              >
                <Icon as={icon} boxSize="18px" color={tone.color} />
              </Flex>
              <Tooltip content={t(`Wallet.balance.${key}.help`)} showArrow>
                <IconButton
                  aria-label={t(`Wallet.balance.${key}.help`)}
                  variant="plain"
                  size="2xs"
                  minW="auto"
                  color="#C4CDD8"
                  _hover={{ color: "#8A9AB5" }}
                >
                  <LuInfo />
                </IconButton>
              </Tooltip>
            </Flex>
            <Stack gap="4px">
              <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                {t(`Wallet.balance.${key}.label`)}
              </Text>
              <Value indicator={data[key]} color={tone.color} />
            </Stack>
            <Text color="#A0ABB8" fontSize="11px" lineHeight="15px">
              {data[key].caption}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="16px">
        <Stack
          {...CARD}
          borderColor={BLUE.iconBorder}
          rounded="14px"
          gap="16px"
          p="20px"
        >
          <Flex align="center" justify="space-between" gap="8px">
            <SummaryHeader
              icon={LuWalletCards}
              tone={BLUE}
              label={t("Wallet.balance.credit.label")}
            />
            <Badge
              gap="4px"
              px="10px"
              py="4px"
              bg={BLUE.iconBg}
              color={BLUE.color}
              rounded="full"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
            >
              <LuShield />
              {t("Wallet.balance.credit.noExpiry")}
            </Badge>
          </Flex>
          <Stack gap="4px">
            <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
              {data.credit.caption}
            </Text>
            <Value indicator={data.credit} color={BLUE.color} />
          </Stack>
        </Stack>

        {SUMMARY.map(({ key, icon, tone }) => (
          <Stack key={key} {...CARD} rounded="14px" gap="16px" p="20px">
            <SummaryHeader
              icon={icon}
              tone={tone}
              label={t(`Wallet.balance.${key}.label`)}
            />
            <Stack gap="8px">
              <Value indicator={data[key]} color={tone.color} />
              <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
                {data[key].caption}
              </Text>
            </Stack>
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
