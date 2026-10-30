import type { TFunction } from "i18next";

import type {
  WalletCurrency,
  WalletTransaction,
} from "@/services/wallet.service";

/** Filtros rápidos do histórico (Figma 2208-35170). */
export type WalletTransactionFilter = "all" | "credits" | "debits" | "escrow";

/** Situação exibida na linha. O ledger só guarda lançamentos efetivados. */
export type WalletTransactionStatus = "completed" | "pending" | "failed";

interface FormatMinorOptions {
  /** "+R$ 10,00" / "-R$ 10,00". */
  sign?: "+" | "-";
  /** 0 para o valor arredondado dos cards do topo ("R$ 24.744"). */
  maximumFractionDigits?: number;
}

/** Valor em unidades mínimas (centavos) na moeda e no idioma da interface. */
export function formatMinorAmount(
  minor: number,
  currency: WalletCurrency,
  locale: string,
  { sign, maximumFractionDigits }: FormatMinorOptions = {},
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : undefined,
  }).format(minor / 100);
  return sign ? `${sign}${formatted}` : formatted;
}

/** Data do lançamento (epoch em segundos) no formato curto do idioma. */
export function formatTransactionDate(createdAt: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
    new Date(createdAt * 1000),
  );
}

/**
 * Descrição do lançamento. Crédito com cancelamento é o crédito Neutra+ do
 * pedido cancelado; débito é o uso do saldo no checkout do pedido.
 */
export function describeTransaction(
  transaction: WalletTransaction,
  t: TFunction,
): string {
  const order = transaction.orderId;
  if (transaction.kind === "debit") {
    return t("Wallet.transactions.kinds.payment", { order });
  }
  return transaction.cancellationId
    ? t("Wallet.transactions.kinds.cancellationCredit", { order })
    : t("Wallet.transactions.kinds.credit", { order });
}

export function matchesFilter(
  transaction: WalletTransaction,
  filter: WalletTransactionFilter,
): boolean {
  if (filter === "credits") return transaction.kind === "credit";
  if (filter === "debits") return transaction.kind === "debit";
  // A carteira ainda não recebe lançamentos de escrow (vêm dos pagamentos).
  if (filter === "escrow") return false;
  return true;
}

/** Busca por descrição ou referência (pedido, pagamento, lançamento). */
export function matchesSearch(
  transaction: WalletTransaction,
  description: string,
  query: string,
): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return [
    description,
    transaction.orderId,
    transaction.paymentId,
    transaction.id,
  ].some((value) => value.toLowerCase().includes(term));
}

export interface WalletPeriodSummary {
  creditedMinor: number;
  creditCount: number;
  spentMinor: number;
  debitCount: number;
}

/** Créditos e débitos do mês de `now` (fuso local). */
export function summarizeMonth(
  transactions: WalletTransaction[],
  now: Date = new Date(),
): WalletPeriodSummary {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  return transactions.reduce<WalletPeriodSummary>(
    (summary, transaction) => {
      const time = transaction.createdAt * 1000;
      if (time < start || time >= end) return summary;
      if (transaction.kind === "credit") {
        summary.creditedMinor += transaction.amountMinor;
        summary.creditCount += 1;
      } else {
        summary.spentMinor += transaction.amountMinor;
        summary.debitCount += 1;
      }
      return summary;
    },
    { creditedMinor: 0, creditCount: 0, spentMinor: 0, debitCount: 0 },
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Extrato em CSV (separador vírgula, valores com ponto decimal e data ISO),
 * para abrir em planilha sem depender do idioma da interface.
 */
export function transactionsToCsv(
  transactions: WalletTransaction[],
  describe: (transaction: WalletTransaction) => string,
): string {
  const header = [
    "date",
    "kind",
    "description",
    "order",
    "amount",
    "currency",
    "id",
  ];
  const rows = transactions.map((transaction) =>
    [
      new Date(transaction.createdAt * 1000).toISOString(),
      transaction.kind,
      describe(transaction),
      transaction.orderId,
      (
        ((transaction.kind === "debit" ? -1 : 1) * transaction.amountMinor) /
        100
      ).toFixed(2),
      transaction.currency,
      transaction.id,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
