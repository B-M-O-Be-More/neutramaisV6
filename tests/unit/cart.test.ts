import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  cartLinePrice,
  cartMaxQuantity,
  decimalToMinor,
} from "@/functions/cartPricing";
import { buildCartView } from "@/functions/cartView";
import { checkoutBlockReason } from "@/functions/checkoutBlock";
import { useCart } from "@/hooks/useCart";
import type { CheckoutSnapshot } from "@/services/checkoutSnapshot.service";

function snapshot(overrides: Partial<CheckoutSnapshot> = {}): CheckoutSnapshot {
  return {
    schemaVersion: 2,
    offeringId: "offer-1",
    sellerOrganizationId: "seller-a",
    revision: 3,
    snapshotVersion: "a".repeat(64),
    name: "Link Dedicado 500 Mbps",
    pricingMode: "fixed",
    currency: "BRL",
    prices: [
      {
        id: "p1",
        priceType: "one_time",
        currency: "BRL",
        amount: "1500.00",
        recurringPeriod: null,
        minQuantity: 1,
        maxQuantity: 9,
      },
      {
        id: "p2",
        priceType: "one_time",
        currency: "BRL",
        amount: "1200.50",
        recurringPeriod: null,
        minQuantity: 10,
        maxQuantity: null,
      },
      {
        id: "p3",
        priceType: "recurring",
        currency: "BRL",
        amount: "2490.00",
        recurringPeriod: "month",
        minQuantity: 1,
        maxQuantity: null,
      },
    ],
    durationMonths: 12,
    speed: "500 Mbps",
    productType: "service",
    stockQuantity: null,
    purchaseLimitPerAccount: 20,
    specification: {
      id: "spec-1",
      name: "Conectividade",
      estimatedInstallationDays: 7,
    },
    shipping: null,
    ...overrides,
  };
}

describe("cartPricing", () => {
  it("converte decimal em centavos sem ponto flutuante", () => {
    expect(decimalToMinor("2490.00")).toBe(249000);
    expect(decimalToMinor("1200.5")).toBe(120050);
    expect(decimalToMinor("0.07")).toBe(7);
    expect(decimalToMinor("15")).toBe(1500);
  });

  it("soma cada tipo de preço na faixa da quantidade", () => {
    expect(cartLinePrice(snapshot(), 2)?.totalMinor).toBe(
      2 * 150000 + 2 * 249000,
    );
    // A partir de 10 unidades vale a outra faixa do preço único.
    expect(cartLinePrice(snapshot(), 10)?.totalMinor).toBe(
      10 * 120050 + 10 * 249000,
    );
  });

  it("sem faixa para a quantidade, não há preço", () => {
    const capped = snapshot({
      prices: [{ ...snapshot().prices[0], maxQuantity: 5 }],
    });
    expect(cartLinePrice(capped, 6)).toBeNull();
  });

  it("limita a quantidade ao estoque e ao limite por conta", () => {
    expect(cartMaxQuantity(snapshot())).toBe(20);
    expect(cartMaxQuantity(snapshot({ stockQuantity: 3 }))).toBe(3);
    expect(
      cartMaxQuantity(
        snapshot({ stockQuantity: null, purchaseLimitPerAccount: null }),
      ),
    ).toBe(100);
  });
});

describe("buildCartView", () => {
  it("agrupa por seller, separa indisponíveis e soma por moeda", () => {
    const view = buildCartView(
      [
        { offeringId: "a1", quantity: 1 },
        { offeringId: "b1", quantity: 1 },
        { offeringId: "a2", quantity: 2 },
        { offeringId: "gone", quantity: 1 },
        { offeringId: "pending", quantity: 1 },
      ],
      new Map([
        ["a1", { status: "ready", snapshot: snapshot() }],
        [
          "b1",
          {
            status: "ready",
            snapshot: snapshot({
              sellerOrganizationId: "seller-b",
              currency: "USD",
              prices: [{ ...snapshot().prices[2], currency: "USD" }],
            }),
          },
        ],
        [
          "a2",
          {
            status: "ready",
            snapshot: snapshot({ productType: "physical" }),
          },
        ],
        ["gone", { status: "unavailable", snapshot: null }],
      ]),
    );

    expect(view.groups.map((group) => group.sellerOrganizationId)).toEqual([
      "seller-a",
      "seller-b",
    ]);
    expect(view.groups[0].lines).toHaveLength(2);
    expect(view.unavailable).toEqual([
      { entry: { offeringId: "gone", quantity: 1 }, status: "unavailable" },
    ]);
    expect(view.isLoading).toBe(true);
    expect(view.hasPhysical).toBe(true);
    expect(view.hasProblems).toBe(true);
    expect(Object.fromEntries(view.subtotals)).toEqual({
      BRL: 399000 + 2 * 399000,
      USD: 249000,
    });
  });

  it("marca oferta sob consulta e quantidade acima do limite", () => {
    const view = buildCartView(
      [
        { offeringId: "rfq", quantity: 1 },
        { offeringId: "many", quantity: 5 },
      ],
      new Map([
        [
          "rfq",
          { status: "ready", snapshot: snapshot({ pricingMode: "rfq" }) },
        ],
        ["many", { status: "ready", snapshot: snapshot({ stockQuantity: 2 }) }],
      ]),
    );

    expect(view.groups[0].lines.map((line) => line.problem)).toEqual([
      "rfq",
      "overLimit",
    ]);
    expect(view.subtotals.size).toBe(0);
  });
});

describe("checkoutBlockReason", () => {
  it.each([
    ["rejected", true, "rejected"],
    ["pending", true, "notStarted"],
    ["basic", true, "notStarted"],
    ["under_review", true, "inReview"],
    ["suspended", true, "suspended"],
    ["verified", false, "ineligible"],
    ["verified", true, null],
    ["complete", true, null],
  ])("%s (elegível: %s) → %s", (kyc_state, transaction_eligible, reason) => {
    expect(checkoutBlockReason({ kyc_state, transaction_eligible })).toBe(
      reason,
    );
  });
});

describe("useCart", () => {
  beforeEach(() => localStorage.clear());

  it("guarda por organização, sem repetir a oferta", () => {
    const { result } = renderHook(() => useCart("org-1"));

    act(() => result.current.add("offer-1"));
    act(() => result.current.add("offer-1"));
    act(() => result.current.add("offer-2"));
    expect(result.current.entries).toEqual([
      { offeringId: "offer-1", quantity: 1 },
      { offeringId: "offer-2", quantity: 1 },
    ]);

    const other = renderHook(() => useCart("org-2"));
    expect(other.result.current.entries).toEqual([]);
  });

  it("limita a quantidade de 1 a 100 e remove", () => {
    const { result } = renderHook(() => useCart("org-1"));
    act(() => result.current.add("offer-1"));

    act(() => result.current.setQuantity("offer-1", 250));
    expect(result.current.entries[0].quantity).toBe(100);
    act(() => result.current.setQuantity("offer-1", 0));
    expect(result.current.entries[0].quantity).toBe(1);

    act(() => result.current.remove("offer-1"));
    expect(result.current.entries).toEqual([]);
  });
});
