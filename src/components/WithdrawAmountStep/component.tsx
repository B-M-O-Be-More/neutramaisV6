"use client";

import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuClock, LuWallet, LuZap } from "react-icons/lu";

import WithdrawStepActions from "@/components/WithdrawStepActions";
import WithdrawStepHeading from "@/components/WithdrawStepHeading";
import { formatMinorAmount } from "@/functions/walletTransactions";
import {
  centsFromDigits,
  formatRate,
  QUICK_AMOUNTS_MINOR,
  WITHDRAWAL_MODES,
} from "@/functions/withdrawal";
import type { WalletCurrency } from "@/services/wallet.service";
import type { WithdrawalMode } from "@/services/withdrawal.service";

import { WithdrawAmountStepProps } from "./interface";

const MODES: {
  key: WithdrawalMode;
  icon: typeof LuClock;
  iconColor: string;
  badge: { color: string; bg: string };
}[] = [
  {
    key: "normal",
    icon: LuClock,
    iconColor: "#1F5AFF",
    badge: { color: "#10B981", bg: "#EDFBF5" },
  },
  {
    key: "express",
    icon: LuZap,
    iconColor: "#D97706",
    badge: { color: "#D97706", bg: "#FFFBEB" },
  },
];

const QUICK_BUTTON = {
  type: "button",
  variant: "outline",
  h: "35px",
  bg: "white",
  borderColor: "#E5E8EE",
  rounded: "15px",
  color: "#5A6478",
  fontSize: "13px",
  fontWeight: 600,
} as const;

/**
 * Etapa "Valor" do saque (Figma 2215-23978): quanto sacar (atalhos e "Tudo")
 * e a modalidade, com a taxa de cada uma. O valor não pode passar do saldo.
 */
export function WithdrawAmountStep({
  availableMinor,
  isLoadingBalance,
  balanceError = null,
  currency,
  locale,
  amountMinor,
  mode,
  onAmountChange,
  onModeChange,
  onNext,
}: WithdrawAmountStepProps) {
  const { t } = useTranslation();
  const [showError, setShowError] = React.useState(false);
  const money = (minor: number) =>
    formatMinorAmount(minor, currency as WalletCurrency, locale);

  const error =
    amountMinor <= 0
      ? "Wallet.withdraw.amount.errors.required"
      : availableMinor !== null && amountMinor > availableMinor
        ? "Wallet.withdraw.amount.errors.exceeds"
        : null;

  const display = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);

  const next = () => {
    if (error || availableMinor === null) {
      setShowError(true);
      return;
    }
    onNext();
  };

  return (
    <Stack gap="24px">
      <WithdrawStepHeading
        icon={LuWallet}
        title={t("Wallet.withdraw.amount.title")}
        subtitle={
          isLoadingBalance ? (
            <Skeleton as="span" display="inline-block" h="16px" w="180px" />
          ) : availableMinor === null ? (
            (balanceError ?? t("Wallet.withdraw.amount.errors.balance"))
          ) : (
            <>
              {t("Wallet.withdraw.amount.available")}{" "}
              <chakra.strong color="#0F1729" fontWeight={700}>
                {money(availableMinor)}
              </chakra.strong>
            </>
          )
        }
      />

      <Stack
        gap="8px"
        p="24px"
        bg="white"
        borderWidth="2px"
        borderColor={showError && error ? "#FECACA" : "#D5DDEF"}
        rounded="16px"
      >
        <Text
          asChild
          color="#A0ABB8"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
          textTransform="uppercase"
        >
          <label htmlFor="withdraw-amount">
            {t("Wallet.withdraw.amount.label")}
          </label>
        </Text>
        <Flex align="center" gap="12px">
          <Text
            color="#0F1729"
            fontSize="28px"
            fontWeight={800}
            lineHeight="42px"
            aria-hidden
          >
            {t("Wallet.withdraw.amount.symbol")}
          </Text>
          <Input
            id="withdraw-amount"
            inputMode="numeric"
            autoComplete="off"
            value={display}
            onChange={(event) =>
              onAmountChange(centsFromDigits(event.target.value))
            }
            aria-invalid={showError && !!error}
            aria-describedby={
              showError && error ? "withdraw-amount-error" : undefined
            }
            h="54px"
            p="0"
            border="none"
            color="#0F1729"
            fontSize="36px"
            fontWeight={800}
            _focusVisible={{ outline: "none", boxShadow: "none" }}
          />
        </Flex>
        {showError && error && (
          <Text
            id="withdraw-amount-error"
            role="alert"
            color="#EF4444"
            fontSize="12px"
            lineHeight="18px"
          >
            {t(error)}
          </Text>
        )}
      </Stack>

      <Stack gap="12px">
        <SimpleGrid columns={3} gap="12px">
          {QUICK_AMOUNTS_MINOR.map((value) => (
            <Button
              key={value}
              {...QUICK_BUTTON}
              onClick={() => onAmountChange(value)}
            >
              {money(value)}
            </Button>
          ))}
        </SimpleGrid>
        <Button
          {...QUICK_BUTTON}
          h="41px"
          disabled={availableMinor === null}
          onClick={() =>
            availableMinor !== null && onAmountChange(availableMinor)
          }
        >
          {t("Wallet.withdraw.amount.all")}
        </Button>
      </Stack>

      <Stack gap="12px">
        <Text
          id="withdraw-mode-label"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("Wallet.withdraw.amount.modeTitle")}
        </Text>
        <Stack
          role="radiogroup"
          aria-labelledby="withdraw-mode-label"
          gap="8px"
        >
          {MODES.map((option) => {
            const isSelected = mode === option.key;
            return (
              <chakra.button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onModeChange(option.key)}
                display="flex"
                alignItems="center"
                gap="12px"
                p="16px"
                textAlign="start"
                bg={isSelected ? "#EEF3FF" : "white"}
                borderWidth="2px"
                borderColor={isSelected ? "#1F5AFF" : "#E5E8EE"}
                rounded="14px"
                cursor="pointer"
                _focusVisible={{
                  outline: "2px solid #1F5AFF",
                  outlineOffset: "2px",
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="36px"
                  flexShrink={0}
                  bg="white"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  rounded="14px"
                >
                  <Icon
                    as={option.icon}
                    boxSize="15px"
                    color={option.iconColor}
                  />
                </Flex>
                <Stack gap="0" flex="1" minW={0}>
                  <Flex align="center" gap="8px" wrap="wrap">
                    <Text
                      color="#0F1729"
                      fontSize="13px"
                      fontWeight={700}
                      lineHeight="19.5px"
                    >
                      {t(`Wallet.withdraw.modes.${option.key}.title`)}
                    </Text>
                    <Box
                      px="8px"
                      py="2px"
                      bg={option.badge.bg}
                      rounded="8px"
                      color={option.badge.color}
                      fontSize="9px"
                      fontWeight={700}
                      lineHeight="13.5px"
                    >
                      {t(`Wallet.withdraw.modes.${option.key}.badge`)}
                    </Box>
                  </Flex>
                  <Text
                    color="#8A9AB5"
                    fontSize="12px"
                    fontWeight={500}
                    lineHeight="18px"
                  >
                    {t("Wallet.withdraw.amount.fee", {
                      rate: formatRate(
                        WITHDRAWAL_MODES[option.key].rateBps,
                        locale,
                      ),
                    })}
                  </Text>
                </Stack>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="16px"
                  flexShrink={0}
                  bg={isSelected ? "#1F5AFF" : "white"}
                  borderWidth="2px"
                  borderColor={isSelected ? "#1F5AFF" : "#C4CDD8"}
                  rounded="full"
                >
                  {isSelected && (
                    <Box boxSize="6px" rounded="full" bg="white" />
                  )}
                </Flex>
              </chakra.button>
            );
          })}
        </Stack>
      </Stack>

      <WithdrawStepActions
        nextLabel={t("Wallet.withdraw.nav.next")}
        onNext={next}
      />
    </Stack>
  );
}
