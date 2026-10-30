import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  describeTransaction,
  formatMinorAmount,
  matchesFilter,
  matchesSearch,
  summarizeMonth,
  transactionsToCsv,
} from "@/functions/walletTransactions";
import type { WalletTransaction } from "@/services/wallet.service";

const t = ((key: string, options?: { order?: string }) =>
  options?.order ? `${key}:${options.order}` : key) as unknown as TFunction;

const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function transaction(
  overrides: Partial<WalletTransaction> = {},
): WalletTransaction {
  return {
    id: "tx-1",
    kind: "credit",
    currency: "BRL",
    amountMinor: 2450000,
    orderId: "ORD-2026-005",
    paymentId: "pay-1",
    allocationId: "alloc-1",
    cancellationId: "cancel-1",
    externalPaidMinor: 2450000,
    walletPaidMinor: 0,
    createdAt: at("2026-10-26T12:00:00"),
    ...overrides,
  };
}

const normalize = (text: string) => text.replace(/\s/g, " ");

describe("formatMinorAmount", () => {
  it("converte centavos na moeda do idioma", () => {
    expect(normalize(formatMinorAmount(2474403, "BRL", "pt-BR"))).toBe(
      "R$ 24.744,03",
    );
  });

  it("arredonda e aplica o sinal", () => {
    expect(
      normalize(
        formatMinorAmount(2474403, "BRL", "pt-BR", {
          maximumFractionDigits: 0,
        }),
      ),
    ).toBe("R$ 24.744");
    expect(
      normalize(formatMinorAmount(10999, "BRL", "pt-BR", { sign: "-" })),
    ).toBe("-R$ 109,99");
  });
});

describe("describeTransaction", () => {
  it("diferencia crédito de cancelamento, crédito e pagamento", () => {
    expect(describeTransaction(transaction(), t)).toBe(
      "Wallet.transactions.kinds.cancellationCredit:ORD-2026-005",
    );
    expect(describeTransaction(transaction({ cancellationId: null }), t)).toBe(
      "Wallet.transactions.kinds.credit:ORD-2026-005",
    );
    expect(describeTransaction(transaction({ kind: "debit" }), t)).toBe(
      "Wallet.transactions.kinds.payment:ORD-2026-005",
    );
  });
});

describe("filtros do histórico", () => {
  it("separa créditos e débitos; escrow ainda não tem lançamentos", () => {
    const credit = transaction();
    const debit = transaction({ kind: "debit" });

    expect(matchesFilter(credit, "all")).toBe(true);
    expect(matchesFilter(credit, "credits")).toBe(true);
    expect(matchesFilter(debit, "credits")).toBe(false);
    expect(matchesFilter(debit, "debits")).toBe(true);
    expect(matchesFilter(credit, "escrow")).toBe(false);
  });

  it("busca na descrição e nas referências, sem diferenciar caixa", () => {
    const item = transaction();

    expect(matchesSearch(item, "Crédito Neutra+", "neutra")).toBe(true);
    expect(matchesSearch(item, "", "ord-2026-005")).toBe(true);
    expect(matchesSearch(item, "", "pay-1")).toBe(true);
    expect(matchesSearch(item, "", "ORD-2026-999")).toBe(false);
    expect(matchesSearch(item, "", "   ")).toBe(true);
  });
});

describe("summarizeMonth", () => {
  it("soma só os lançamentos do mês corrente", () => {
    const now = new Date("2026-10-29T10:00:00");
    const summary = summarizeMonth(
      [
        transaction({
          amountMinor: 1000,
          createdAt: at("2026-10-01T00:00:00"),
        }),
        transaction({ amountMinor: 500, createdAt: at("2026-10-29T09:00:00") }),
        transaction({
          kind: "debit",
          amountMinor: 300,
          createdAt: at("2026-10-15T00:00:00"),
        }),
        // Fora do mês.
        transaction({
          amountMinor: 9999,
          createdAt: at("2026-09-30T23:59:00"),
        }),
        transaction({
          amountMinor: 9999,
          createdAt: at("2026-11-01T00:00:00"),
        }),
      ],
      now,
    );

    expect(summary).toEqual({
      creditedMinor: 1500,
      creditCount: 2,
      spentMinor: 300,
      debitCount: 1,
    });
  });
});

describe("transactionsToCsv", () => {
  it("gera cabeçalho, valor com sinal e escapa vírgulas e aspas", () => {
    const csv = transactionsToCsv(
      [
        transaction({ createdAt: at("2026-10-26T12:00:00Z") }),
        transaction({
          id: "tx-2",
          kind: "debit",
          amountMinor: 10999,
          createdAt: at("2026-10-02T08:00:00Z"),
        }),
      ],
      (item) => (item.kind === "debit" ? 'Pagamento, "Fibra"' : "Crédito"),
    );

    expect(csv.split("\n")).toEqual([
      "date,kind,description,order,amount,currency,id",
      "2026-10-26T12:00:00.000Z,credit,Crédito,ORD-2026-005,24500.00,BRL,tx-1",
      '2026-10-02T08:00:00.000Z,debit,"Pagamento, ""Fibra""",ORD-2026-005,-109.99,BRL,tx-2',
    ]);
  });
});
