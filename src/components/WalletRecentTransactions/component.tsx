"use client";

import {
  Button,
  Flex,
  Icon,
  Link,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuRefreshCw } from "react-icons/lu";

import WalletTransactionRow from "@/components/WalletTransactionRow";
import {
  describeTransaction,
  formatMinorAmount,
  formatTransactionDate,
} from "@/functions/walletTransactions";

import { WalletRecentTransactionsProps } from "./interface";

const LINK = {
  gap: "6px",
  color: "#1F5AFF",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "19.5px",
} as const;

/** Últimos lançamentos da carteira (Figma 2250-22194). */
export function WalletRecentTransactions({
  transactions,
  isLoading,
  error,
  onRetry,
  historyHref,
  locale,
}: WalletRecentTransactionsProps) {
  const { t } = useTranslation();

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <Stack gap="12px" py="16px" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} h="44px" rounded="10px" />
        ))}
      </Stack>
    );
  } else if (error || transactions.length === 0) {
    content = (
      <Stack align="center" gap="10px" py="32px" textAlign="center">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t(error ?? "Wallet.transactions.empty")}
        </Text>
        {error && (
          <Button
            variant="plain"
            h="32px"
            px="12px"
            gap="6px"
            rounded="10px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontSize="12px"
            fontWeight={600}
            onClick={onRetry}
          >
            <Icon as={LuRefreshCw} boxSize="12px" />
            {t("Wallet.retry")}
          </Button>
        )}
      </Stack>
    );
  } else {
    content = transactions.map((transaction, index) => {
      const isCredit = transaction.kind === "credit";
      return (
        <WalletTransactionRow
          key={transaction.id}
          tone={isCredit ? "credit" : "debit"}
          title={describeTransaction(transaction, t)}
          date={formatTransactionDate(transaction.createdAt, locale)}
          reference={transaction.orderId}
          amount={formatMinorAmount(
            transaction.amountMinor,
            transaction.currency,
            locale,
            { sign: isCredit ? "+" : "-" },
          )}
          isLast={index === transactions.length - 1}
        />
      );
    });
  }

  return (
    <Stack
      gap="0"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        gap="12px"
        px="20px"
        py="16px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Text
          as="h2"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t("Wallet.transactions.title")}
        </Text>
        <Link asChild {...LINK}>
          <NextLink href={historyHref}>
            {t("Wallet.transactions.viewAll")}
            <Icon as={LuArrowRight} boxSize="13px" />
          </NextLink>
        </Link>
      </Flex>

      <Stack gap="0" px="20px">
        {content}
      </Stack>

      {!isLoading && !error && transactions.length > 0 && (
        <Flex
          justify="center"
          py="12px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Link asChild {...LINK}>
            <NextLink href={historyHref}>
              {t("Wallet.transactions.viewAllFooter")}
              <Icon as={LuArrowRight} boxSize="13px" />
            </NextLink>
          </Link>
        </Flex>
      )}
    </Stack>
  );
}
