import { describe, expect, it } from "vitest";

import {
  summarizeReceivables,
  totalShippingDebt,
} from "@/functions/sellerFinance";
import {
  centsFromDigits,
  formatRate,
  withdrawalBreakdown,
} from "@/functions/withdrawal";
import type {
  SellerReceivable,
  ShippingCostDebt,
} from "@/services/sellerPayout.service";

const receivable = (
  overrides: Partial<SellerReceivable> = {},
): SellerReceivable => ({
  allocationId: "a",
  orderId: "o",
  sellerOrganizationId: "org",
  currency: "BRL",
  grossMinor: 10_000,
  feeMinor: 1_000,
  netMinor: 9_000,
  eligible: true,
  batchId: null,
  cancellationId: null,
  ...overrides,
});

const debt = (amountMinor: number, currency = "BRL") =>
  ({ amountMinor, currency }) as ShippingCostDebt;

describe("summarizeReceivables", () => {
  it("a receber: fora de lote e não cancelado; taxas: não cancelados", () => {
    expect(
      summarizeReceivables(
        [
          receivable(),
          receivable({ netMinor: 1_000, feeMinor: 500 }),
          receivable({ batchId: "lote-1" }),
          receivable({ cancellationId: "c-1" }),
          receivable({ currency: "USD" }),
        ],
        "BRL",
      ),
    ).toEqual({ toReceiveMinor: 10_000, toReceiveOrders: 2, feesMinor: 2_500 });
  });
});

describe("totalShippingDebt", () => {
  it("soma as dívidas da moeda", () => {
    expect(
      totalShippingDebt([debt(450), debt(50), debt(900, "USD")], "BRL"),
    ).toBe(500);
  });
});

describe("withdrawal", () => {
  it("taxa arredondada ao centavo e líquido", () => {
    expect(withdrawalBreakdown(50_000, "normal")).toEqual({
      grossMinor: 50_000,
      feeMinor: 750,
      netMinor: 49_250,
    });
    expect(withdrawalBreakdown(333, "express")).toEqual({
      grossMinor: 333,
      feeMinor: 12,
      netMinor: 321,
    });
  });

  it("formata a taxa no idioma", () => {
    expect(formatRate(150, "pt-BR")).toBe("1,5%");
    expect(formatRate(350, "en-US")).toBe("3.5%");
  });

  it("dígitos viram centavos", () => {
    expect(centsFromDigits("R$ 1.234,56")).toBe(123_456);
    expect(centsFromDigits("")).toBe(0);
  });
});
