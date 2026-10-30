"use client";

import {
  Box,
  Button,
  Field,
  Flex,
  Icon,
  Input,
  InputGroup,
  Link,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuChevronLeft,
  LuDownload,
  LuRefreshCw,
  LuSearch,
  LuSlidersHorizontal,
} from "react-icons/lu";

import WalletTransactionRow from "@/components/WalletTransactionRow";
import { downloadTextFile } from "@/functions/downloadTextFile";
import { todayIso } from "@/functions/todayIso";
import {
  describeTransaction,
  formatMinorAmount,
  formatTransactionDate,
  matchesFilter,
  matchesSearch,
  transactionsToCsv,
  type WalletTransactionFilter,
} from "@/functions/walletTransactions";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";

import { WalletTransactionsProps } from "./interface";

const PAGE_SIZE = 50;

const FILTERS: WalletTransactionFilter[] = [
  "all",
  "credits",
  "debits",
  "escrow",
];

const LEGEND = [
  { key: "credit", color: "#10B981" },
  { key: "debit", color: "#EF4444" },
  { key: "escrow", color: "#D97706" },
  { key: "release", color: "#8B5CF6" },
] as const;

const CARD = {
  bg: "white",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "14px",
} as const;

const CONTROL = {
  h: "40px",
  px: "12px",
  gap: "8px",
  rounded: "14px",
  fontSize: "13px",
  lineHeight: "19.5px",
} as const;

/** Início e fim (exclusivo) do período em epoch segundos; vazio = aberto. */
function periodBounds(from: string, to: string) {
  const start = from ? new Date(`${from}T00:00:00`).getTime() / 1000 : null;
  const end = to ? new Date(`${to}T00:00:00`).getTime() / 1000 + 86_400 : null;
  return { start, end };
}

/**
 * Histórico de transações da carteira (Figma 2208-35170): busca, filtros
 * rápidos, período, indicadores e a lista paginada por cursor. Exporta em CSV
 * o que está filtrado na tela.
 */
export function WalletTransactions({
  backHref,
  locale,
}: WalletTransactionsProps) {
  const { t } = useTranslation();
  const statement = useWalletTransactions({ limit: PAGE_SIZE });
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<WalletTransactionFilter>("all");
  const [showPeriod, setShowPeriod] = React.useState(false);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const all = statement.transactions;
  const credits = all.filter((item) => item.kind === "credit").length;
  const debits = all.length - credits;

  const { start, end } = periodBounds(from, to);
  const visible = all.filter((transaction) => {
    if (!matchesFilter(transaction, filter)) return false;
    if (start !== null && transaction.createdAt < start) return false;
    if (end !== null && transaction.createdAt >= end) return false;
    return matchesSearch(
      transaction,
      describeTransaction(transaction, t),
      query,
    );
  });

  const exportCsv = () => {
    downloadTextFile(
      `transacoes-${todayIso()}.csv`,
      transactionsToCsv(visible, (transaction) =>
        describeTransaction(transaction, t),
      ),
      "text/csv",
    );
  };

  const kpis = [
    { key: "total", value: all.length, color: "#0F1729" },
    { key: "credits", value: credits, color: "#10B981" },
    { key: "debits", value: debits, color: "#EF4444" },
    // O ledger só registra lançamentos efetivados.
    { key: "pending", value: 0, color: "#D97706" },
  ] as const;

  let list: React.ReactNode;
  if (statement.isLoading) {
    list = (
      <Stack gap="12px" p="20px" aria-busy="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} h="48px" rounded="10px" />
        ))}
      </Stack>
    );
  } else if (statement.error || visible.length === 0) {
    list = (
      <Stack align="center" gap="10px" py="40px" px="20px" textAlign="center">
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t(
            statement.error ??
              (all.length === 0
                ? "Wallet.transactions.empty"
                : "Wallet.transactions.emptyFiltered"),
          )}
        </Text>
        {statement.error && (
          <Button
            variant="plain"
            {...CONTROL}
            h="32px"
            borderWidth="1px"
            borderColor="#E5E8EE"
            color="#1F5AFF"
            fontWeight={600}
            onClick={statement.reload}
          >
            <Icon as={LuRefreshCw} boxSize="12px" />
            {t("Wallet.retry")}
          </Button>
        )}
      </Stack>
    );
  } else {
    list = visible.map((transaction, index) => {
      const isCredit = transaction.kind === "credit";
      return (
        <WalletTransactionRow
          key={transaction.id}
          size="regular"
          tone={isCredit ? "credit" : "debit"}
          title={describeTransaction(transaction, t)}
          date={formatTransactionDate(transaction.createdAt, locale)}
          reference={transaction.orderId}
          status="completed"
          amount={formatMinorAmount(
            transaction.amountMinor,
            transaction.currency,
            locale,
            { sign: isCredit ? "+" : "-" },
          )}
          isLast={index === visible.length - 1 && !statement.hasMore}
        />
      );
    });
  }

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      <Flex align="center" gap="12px">
        <Link
          asChild
          gap="6px"
          color="#8A9AB5"
          fontSize="13px"
          fontWeight={500}
          lineHeight="19.5px"
        >
          <NextLink href={backHref}>
            <Icon as={LuChevronLeft} boxSize="16px" />
            {t("Wallet.back")}
          </NextLink>
        </Link>
        <Text color="#C4CDD8" fontSize="16px" lineHeight="24px" aria-hidden>
          /
        </Text>
        <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
          {t("Wallet.transactions.title")}
        </Text>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap="16px"
      >
        <Stack gap="0">
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="33px"
          >
            {t("Wallet.transactions.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("Wallet.transactions.summary", {
              total: all.length,
              debits,
              credits,
            })}
          </Text>
        </Stack>
        <Button
          variant="plain"
          {...CONTROL}
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#5A6478"
          fontWeight={500}
          disabled={visible.length === 0}
          onClick={exportCsv}
        >
          <Icon as={LuDownload} boxSize="14px" />
          {t("Wallet.transactions.export")}
        </Button>
      </Flex>

      <Stack gap="12px">
        <Flex direction={{ base: "column", lg: "row" }} gap="12px">
          <InputGroup
            flex="1"
            startElement={<Icon as={LuSearch} boxSize="14px" color="#C4CDD8" />}
          >
            <Input
              h="40px"
              bg="white"
              borderColor="#E5E8EE"
              rounded="14px"
              fontSize="13px"
              color="#0F1729"
              _placeholder={{ color: "#C4CDD8" }}
              placeholder={t("Wallet.transactions.searchPlaceholder")}
              aria-label={t("Wallet.transactions.searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          <Flex gap="8px" wrap="wrap">
            <Button
              {...CONTROL}
              bg="#0F1729"
              color="white"
              fontWeight={500}
              aria-expanded={showPeriod}
              onClick={() => setShowPeriod((open) => !open)}
            >
              <Icon as={LuSlidersHorizontal} boxSize="14px" />
              {t("Wallet.transactions.filters")}
            </Button>
            {FILTERS.map((key) => {
              const isActive = filter === key;
              return (
                <Button
                  key={key}
                  {...CONTROL}
                  variant="plain"
                  aria-pressed={isActive}
                  bg={isActive ? "#1F5AFF" : "white"}
                  borderWidth="1px"
                  borderColor={isActive ? "#1F5AFF" : "#E5E8EE"}
                  color={isActive ? "white" : "#5A6478"}
                  fontWeight={isActive ? 600 : 400}
                  onClick={() => setFilter(key)}
                >
                  {t(`Wallet.transactions.filter.${key}`)}
                </Button>
              );
            })}
          </Flex>
        </Flex>

        {showPeriod && (
          <Flex
            {...CARD}
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "flex-end" }}
            gap="12px"
            p="16px"
          >
            {(
              [
                ["from", from, setFrom],
                ["to", to, setTo],
              ] as const
            ).map(([key, value, setValue]) => (
              <Field.Root key={key} maxW={{ sm: "200px" }}>
                <Field.Label color="#5A6478" fontSize="12px" fontWeight={600}>
                  {t(`Wallet.transactions.period.${key}`)}
                </Field.Label>
                <Input
                  type="date"
                  h="40px"
                  rounded="12px"
                  borderColor="#E5E8EE"
                  fontSize="13px"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </Field.Root>
            ))}
            {(from || to) && (
              <Button
                variant="plain"
                {...CONTROL}
                color="#1F5AFF"
                fontWeight={600}
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                {t("Wallet.transactions.period.clear")}
              </Button>
            )}
          </Flex>
        )}
      </Stack>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap="16px">
        {kpis.map((kpi) => (
          <Stack key={kpi.key} {...CARD} gap="0" px="16px" py="12px">
            <Text
              color="#A0ABB8"
              fontSize="9.5px"
              fontWeight={600}
              lineHeight="14.25px"
              letterSpacing="0.5px"
              textTransform="uppercase"
            >
              {t(`Wallet.transactions.kpis.${kpi.key}`)}
            </Text>
            {statement.isLoading ? (
              <Skeleton h="24px" w="40px" mt="6px" rounded="6px" />
            ) : (
              <Text
                color={kpi.color}
                fontSize="22px"
                fontWeight={800}
                lineHeight="33px"
              >
                {kpi.value}
              </Text>
            )}
          </Stack>
        ))}
      </SimpleGrid>

      <Stack {...CARD} gap="0" overflow="hidden">
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap="8px"
          px="20px"
          py="16px"
          borderBottomWidth="1px"
          borderColor="#F4F6F9"
        >
          <Text
            color="#0F1729"
            fontSize="14px"
            fontWeight={600}
            lineHeight="21px"
          >
            {t("Wallet.transactions.results", { count: visible.length })}
          </Text>
          <Flex gap="12px" wrap="wrap">
            {LEGEND.map((item) => (
              <Flex key={item.key} align="center" gap="6px">
                <Box boxSize="8px" rounded="full" bg={item.color} />
                <Text color="#8A9AB5" fontSize="11px" lineHeight="16.5px">
                  {t(`Wallet.transactions.legend.${item.key}`)}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Flex>

        {list}

        {statement.hasMore && !statement.isLoading && (
          <Flex
            justify="center"
            py="12px"
            borderTopWidth="1px"
            borderColor="#F4F6F9"
          >
            <Button
              variant="plain"
              {...CONTROL}
              color="#1F5AFF"
              fontWeight={600}
              loading={statement.isLoadingMore}
              onClick={statement.loadMore}
            >
              {t("Wallet.transactions.loadMore")}
            </Button>
          </Flex>
        )}
      </Stack>
    </Stack>
  );
}
