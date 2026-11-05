"use client";

import {
  Button,
  Collapsible,
  Flex,
  Icon,
  IconButton,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
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

import SellerDebtBanner from "@/components/SellerDebtBanner";
import SellerPayoutAccounts from "@/components/SellerPayoutAccounts";
import { Tooltip } from "@/components/ui/tooltip";
import WalletBalanceCards, {
  type WalletBalanceCardsData,
  type WalletIndicator,
} from "@/components/WalletBalanceCards";
import WalletHint from "@/components/WalletHint";
import WalletMethodsCard from "@/components/WalletMethodsCard";
import WalletRecentTransactions from "@/components/WalletRecentTransactions";
import {
  summarizeReceivables,
  totalShippingDebt,
} from "@/functions/sellerFinance";
import {
  formatMinorAmount,
  summarizeMonth,
} from "@/functions/walletTransactions";
import { useSellerFinance } from "@/hooks/useSellerFinance";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import type { WalletCurrency } from "@/services/wallet.service";
import type { PayoutAccount } from "@/services/withdrawal.service";

import { WalletOverviewProps } from "./interface";

// Lançamentos lidos para os totais do mês; a lista mostra os primeiros.
const MONTH_SAMPLE = 100;
const RECENT_COUNT = 5;

const CURRENCIES: WalletCurrency[] = ["BRL", "USD", "EUR"];

// Nenhuma API lista as contas de recebimento ainda.
const NO_ACCOUNTS: PayoutAccount[] = [];

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
 * Antecipar e Sacar (Figma 2250-22868). A antecipação ainda não tem endpoint:
 * fica desabilitada, com a explicação no tooltip. Sacar abre o fluxo de saque.
 */
function SellerActions({ withdrawHref }: { withdrawHref: string }) {
  const { t } = useTranslation();

  return (
    <Flex gap="8px">
      <Tooltip content={t("Wallet.seller.comingSoon")} showArrow>
        <Flex tabIndex={0} rounded="15px">
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
        </Flex>
      </Tooltip>
      <Button
        asChild
        h="36px"
        px="12px"
        gap="8px"
        bg="#8B5CF6"
        rounded="15px"
        color="white"
        fontSize="14px"
        fontWeight={700}
        boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
        _hover={{ bg: "#7C4DEB" }}
      >
        <NextLink href={withdrawHref}>
          {t("Wallet.seller.payout")}
          <Icon as={LuArrowUpRight} boxSize="15px" />
        </NextLink>
      </Button>
    </Flex>
  );
}

/** Moeda do histórico na carteira do seller (Figma 3084-45154). */
function CurrencySelect({
  value,
  onChange,
}: {
  value: WalletCurrency;
  onChange: (currency: WalletCurrency) => void;
}) {
  const { t } = useTranslation();

  return (
    <NativeSelect.Root size="sm" w="76px" flexShrink={0}>
      <NativeSelect.Field
        aria-label={t("Wallet.transactions.currency")}
        value={value}
        onChange={(event) => onChange(event.target.value as WalletCurrency)}
        h="34px"
        bg="white"
        borderWidth="1px"
        borderColor="#A0ABB8"
        rounded="10px"
        color="#0A0D14"
        fontSize="13px"
        fontWeight={500}
      >
        {CURRENCIES.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

/**
 * Carteira da organização (buyer: Figma 2250-21984; seller: 2250-22028 e
 * 3084-45182). Saldo e extrato vêm da wallet-api; no seller, o a receber, as
 * taxas e a dívida de frete vêm da payment-api. Escrow, disputas e contas de
 * recebimento ainda não têm endpoint e aparecem como "—" ou vazios.
 */
export function WalletOverview({
  variant,
  locale,
  now,
  paymentAccount,
}: WalletOverviewProps) {
  const { t } = useTranslation();
  const isSeller = variant === "seller";
  const basePath = isSeller ? "/seller/wallet" : "/wallet";
  const [historyCurrency, setHistoryCurrency] =
    React.useState<WalletCurrency>("BRL");

  const balance = useWalletBalance();
  const statement = useWalletTransactions({ limit: MONTH_SAMPLE });
  const recent = useWalletTransactions({
    currency: historyCurrency,
    limit: RECENT_COUNT,
  });
  const finance = useSellerFinance(isSeller);

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

  // Seller: a receber e taxas pelos recebíveis; dívida de frete no aviso.
  const receivables = finance.receivables
    ? summarizeReceivables(finance.receivables, currency)
    : null;
  const debtMinor = finance.debts
    ? totalShippingDebt(finance.debts, currency)
    : 0;
  const financeIndicator = (
    value: number | undefined,
    caption: string,
  ): WalletIndicator => ({
    value: value === undefined ? null : money(value),
    caption: finance.receivablesError ? t(finance.receivablesError) : caption,
    isLoading: finance.isLoading,
  });

  const cards: WalletBalanceCardsData = {
    available: {
      value: available === undefined ? null : money(available, 0),
      caption: balanceCaption,
      isLoading: balance.isLoading,
      negative: available !== undefined && available < 0,
    },
    escrow: isSeller
      ? {
          ...financeIndicator(
            receivables === null ? undefined : receivables.toReceiveMinor,
            t("Wallet.seller.balance.toReceive.caption", {
              count: receivables?.toReceiveOrders ?? 0,
            }),
          ),
          value:
            receivables === null ? null : money(receivables.toReceiveMinor, 0),
          label: t("Wallet.seller.balance.toReceive.label"),
          help: t("Wallet.seller.balance.toReceive.help"),
        }
      : { value: null, caption: unavailable },
    dispute: isSeller
      ? {
          value: null,
          caption: unavailable,
          label: t("Wallet.seller.balance.dispute.label"),
        }
      : { value: null, caption: unavailable },
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
    escrowNow: isSeller
      ? {
          ...financeIndicator(
            receivables?.feesMinor,
            t("Wallet.seller.balance.fees.caption"),
          ),
          label: t("Wallet.seller.balance.fees.label"),
        }
      : { value: null, caption: unavailable },
  };

  const history = (
    <WalletRecentTransactions
      transactions={recent.transactions.slice(0, RECENT_COUNT)}
      isLoading={recent.isLoading}
      error={recent.error}
      onRetry={recent.reload}
      historyHref={`${basePath}/transactions`}
      locale={locale}
      headerEnd={
        isSeller ? (
          <CurrencySelect
            value={historyCurrency}
            onChange={setHistoryCurrency}
          />
        ) : undefined
      }
    />
  );

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      {isSeller && <SellerNotice />}
      {isSeller && debtMinor > 0 && (
        <SellerDebtBanner amount={money(debtMinor)} />
      )}

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
        {isSeller && <SellerActions withdrawHref={`${basePath}/withdraw`} />}
      </Flex>

      {/* Sem conta Stripe ativa, o Seller não vende nem recebe. */}
      {isSeller && paymentAccount}

      <WalletBalanceCards data={cards} />

      <WalletHint
        size="notice"
        tone="amber"
        icon={LuCircleAlert}
        title={t("Wallet.withdrawNotice.title")}
        description={t("Wallet.withdrawNotice.description")}
      />

      {isSeller ? (
        // Seller: histórico e contas de recebimento lado a lado.
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="16px" alignItems="start">
          {history}
          <SellerPayoutAccounts
            accounts={NO_ACCOUNTS}
            // Conta de recebimento é uma chave PIX: o cadastro abre no PIX.
            addHref={`${basePath}/payment-methods/new?type=pix`}
          />
        </SimpleGrid>
      ) : (
        <>
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
          {history}
        </>
      )}
    </Stack>
  );
}
