"use client";

import {
  Button,
  Collapsible,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowUpRight,
  LuChevronDown,
  LuCircleAlert,
  LuDollarSign,
  LuX,
  LuZap,
} from "react-icons/lu";

import { Tooltip } from "@/components/ui/tooltip";
import WalletBalanceCards, {
  type WalletBalanceCardsData,
} from "@/components/WalletBalanceCards";
import WalletHint from "@/components/WalletHint";
import WalletMethodsCard from "@/components/WalletMethodsCard";
import WalletRecentTransactions from "@/components/WalletRecentTransactions";
import {
  formatMinorAmount,
  summarizeMonth,
} from "@/functions/walletTransactions";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";

import { WalletOverviewProps } from "./interface";

// Lançamentos lidos para os totais do mês; a lista mostra os primeiros.
const MONTH_SAMPLE = 100;
const RECENT_COUNT = 5;

/** Aviso do topo da carteira do seller (Figma 2250-22842). */
function SellerNotice() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(true);
  const [isDismissed, setDismissed] = React.useState(false);

  if (isDismissed) return null;

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(e) => setOpen(e.open)}>
      <Flex
        align="flex-start"
        gap="12px"
        px="20px"
        py="16px"
        bg="#F3EEFF"
        borderWidth="1px"
        borderColor="#D3BFFD"
        rounded="14px"
      >
        <Flex
          align="center"
          justify="center"
          boxSize="32px"
          flexShrink={0}
          bg="#F3EEFF"
          borderWidth="1px"
          borderColor="#D3BFFD"
          rounded="10px"
        >
          <Icon as={LuDollarSign} boxSize="14px" color="#8B5CF6" />
        </Flex>
        <Stack gap="2px" flex="1" minW={0}>
          <Text
            color="#8B5CF6"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
          >
            {t("Wallet.seller.notice.title")}
          </Text>
          <Collapsible.Content>
            <Text color="#5B21B6" fontSize="12px" lineHeight="18px">
              {t("Wallet.seller.notice.description")}
            </Text>
          </Collapsible.Content>
        </Stack>
        <Flex gap="4px" color="#8A9AB5">
          <Collapsible.Trigger asChild>
            <IconButton
              aria-label={t(
                isOpen
                  ? "Wallet.seller.notice.collapse"
                  : "Wallet.seller.notice.expand",
              )}
              variant="plain"
              size="2xs"
              color="inherit"
            >
              <Icon
                as={LuChevronDown}
                transform={isOpen ? undefined : "rotate(180deg)"}
              />
            </IconButton>
          </Collapsible.Trigger>
          <IconButton
            aria-label={t("Wallet.seller.notice.dismiss")}
            variant="plain"
            size="2xs"
            color="inherit"
            onClick={() => setDismissed(true)}
          >
            <LuX />
          </IconButton>
        </Flex>
      </Flex>
    </Collapsible.Root>
  );
}

/**
 * Antecipação e payout ainda não têm endpoint na wallet-api: os botões do
 * design aparecem desabilitados, com a explicação no tooltip.
 */
function SellerActions() {
  const { t } = useTranslation();

  return (
    <Tooltip content={t("Wallet.seller.comingSoon")} showArrow>
      <Flex gap="8px" tabIndex={0} rounded="15px">
        <Button
          disabled
          h="36px"
          px="12px"
          gap="8px"
          bg="#F3EEFF"
          borderWidth="1px"
          borderColor="#D3BFFD"
          rounded="15px"
          color="#8B5CF6"
          fontSize="14px"
          fontWeight={600}
        >
          <Icon as={LuZap} boxSize="15px" />
          {t("Wallet.seller.advance")}
        </Button>
        <Button
          disabled
          h="36px"
          px="12px"
          gap="8px"
          bg="#8B5CF6"
          rounded="15px"
          color="white"
          fontSize="14px"
          fontWeight={700}
          boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
        >
          {t("Wallet.seller.payout")}
          <Icon as={LuArrowUpRight} boxSize="15px" />
        </Button>
      </Flex>
    </Tooltip>
  );
}

/**
 * Carteira da organização (Figma 2250-21984). Saldo e extrato vêm da
 * wallet-api; escrow, disputas, métodos e contas ainda não têm endpoint e
 * aparecem como "—" ou vazios.
 */
export function WalletOverview({ variant, locale, now }: WalletOverviewProps) {
  const { t } = useTranslation();
  const isSeller = variant === "seller";
  const basePath = isSeller ? "/seller/wallet" : "/wallet";

  const balance = useWalletBalance();
  const statement = useWalletTransactions({ limit: MONTH_SAMPLE });

  const currency = balance.balance?.currency ?? "BRL";
  const money = (minor: number, maximumFractionDigits?: number) =>
    formatMinorAmount(minor, currency, locale, { maximumFractionDigits });

  const month = summarizeMonth(statement.transactions, now);
  const available = balance.balance?.availableMinor;
  const reserved = balance.balance?.reservedMinor ?? 0;
  const unavailable = t("Wallet.balance.unavailable");
  const balanceCaption = balance.error
    ? t(balance.error)
    : reserved > 0
      ? t("Wallet.balance.available.reserved", { amount: money(reserved) })
      : t("Wallet.balance.available.caption");

  const cards: WalletBalanceCardsData = {
    available: {
      value: available === undefined ? null : money(available, 0),
      caption: balanceCaption,
      isLoading: balance.isLoading,
    },
    escrow: { value: null, caption: unavailable },
    dispute: { value: null, caption: unavailable },
    credit: {
      value: available === undefined ? null : money(available),
      caption: t("Wallet.balance.credit.caption"),
      isLoading: balance.isLoading,
    },
    monthCredited: {
      value: statement.error ? null : money(month.creditedMinor),
      caption: t("Wallet.balance.monthCredited.caption", {
        count: month.creditCount,
      }),
      isLoading: statement.isLoading,
    },
    monthSpent: {
      value: statement.error ? null : money(month.spentMinor),
      caption: t("Wallet.balance.monthSpent.caption", {
        count: month.debitCount,
      }),
      isLoading: statement.isLoading,
    },
    escrowNow: { value: null, caption: unavailable },
  };

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      {isSeller && <SellerNotice />}

      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap="16px"
      >
        <Stack gap="4px">
          <Text
            as="h1"
            color="#0F1729"
            fontSize="24px"
            fontWeight={800}
            lineHeight="36px"
          >
            {t(`Wallet.${variant}.title`)}
          </Text>
          <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
            {t(`Wallet.${variant}.subtitle`)}
          </Text>
        </Stack>
        {isSeller && <SellerActions />}
      </Flex>

      <WalletBalanceCards data={cards} />

      <WalletHint
        size="notice"
        tone="amber"
        icon={LuCircleAlert}
        title={t("Wallet.withdrawNotice.title")}
        description={t("Wallet.withdrawNotice.description")}
      />

      <SimpleGrid columns={{ base: 1, lg: isSeller ? 2 : 1 }} gap="16px">
        <WalletMethodsCard
          title={t("Wallet.methods.paymentTitle")}
          addHref={`${basePath}/payment-methods/new`}
          emptyLabel={t("Wallet.methods.paymentEmpty")}
          hint={{
            tone: "blue",
            title: t("Wallet.methods.combinedTitle"),
            description: t("Wallet.methods.combinedDescription"),
          }}
        />
        {isSeller && (
          <WalletMethodsCard
            title={t("Wallet.methods.payoutTitle")}
            // Conta de recebimento é uma chave PIX: o cadastro abre no PIX.
            addHref={`${basePath}/payment-methods/new?type=pix`}
            emptyLabel={t("Wallet.methods.payoutEmpty")}
            hint={{
              tone: "purple",
              title: t("Wallet.methods.pixPayoutTitle"),
              description: t("Wallet.methods.pixPayoutDescription"),
            }}
          />
        )}
      </SimpleGrid>

      <WalletRecentTransactions
        transactions={statement.transactions.slice(0, RECENT_COUNT)}
        isLoading={statement.isLoading}
        error={statement.error}
        onRetry={statement.reload}
        historyHref={`${basePath}/transactions`}
        locale={locale}
      />
    </Stack>
  );
}
