import { describe, expect, it } from "vitest";

import {
  sellerOrderHasSpecification,
  sellerOrderStatus,
  summarizeSellerOrders,
} from "@/functions/sellerOrderSummary";
import type { CheckoutOrder, LegacyOrder } from "@/services/orders.service";

const NOW = new Date("2026-10-30T12:00:00");
const seconds = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function checkout(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    id: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
    orderId: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
    checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
    createdAt: seconds("2026-10-29T10:00:00"),
    buyerOrganizationId: "buyer",
    sellerOrganizationId: "seller",
    status: "accepted",
    items: [
      {
        catalog: {
          offeringId: "offer-1",
          name: "Link Dedicado 500 Mbps",
          specification: { id: "spec-1", name: "Link dedicado em fibra" },
        },
        quantity: 1,
        totalMinor: 399000,
      },
    ],
    totalMinor: 399000,
    walletMinor: 0,
    cardMinor: 399000,
    platformFeeMinor: 29925,
    currency: "BRL",
    contractId: null,
    executionReleased: false,
    paidMinor: 399000,
    creditedMinor: 0,
    reservationStatus: "reserved",
    cancellationStatus: "not_requested",
    compensationStatus: "not_required",
    ...overrides,
  };
}

function legacy(overrides: Partial<LegacyOrder> = {}): LegacyOrder {
  return {
    id: "0b7d3f9a-2e6c-4a1d-8f5b-4c9e1a7d3f26",
    buyerOrganizationId: "buyer",
    sellerOrganizationId: "seller",
    status: "pending",
    items: [
      {
        id: "item-1",
        offeringId: "offer-2",
        offeringName: "Internet Empresarial 300 Mbps",
        specificationName: "Fibra empresarial",
        monthlyPrice: 899.9,
        installationPrice: 0,
        quantity: 1,
      },
    ],
    totalMonthly: 899.9,
    totalInstallation: 0,
    createdAt: "2026-08-12T10:41:09.512331+00:00",
    ...overrides,
  };
}

describe("sellerOrderStatus", () => {
  it.each([
    [checkout({ status: "awaitingPayment" }), "awaiting"],
    [checkout({ status: "accepted" }), "accepted"],
    [checkout({ status: "cancelled" }), "rejected"],
    [
      checkout({ status: "cancelled", reservationStatus: "expired" }),
      "expired",
    ],
    [legacy({ status: "pending" }), "awaiting"],
    [legacy({ status: "completed" }), "accepted"],
    [legacy({ status: "rejected" }), "rejected"],
    [legacy({ status: "cancelled" }), "rejected"],
  ])("%# → %s", (order, status) => {
    expect(sellerOrderStatus(order)).toBe(status);
  });

  it("físico pago aguarda o aceite do envio até o Seller aceitar", () => {
    const physical = checkout({
      items: [
        {
          catalog: {
            offeringId: "offer-ont",
            name: "ONT GPON",
            productType: "physical",
          },
          quantity: 2,
          totalMinor: 50000,
        },
      ],
    });
    const shipping = (accepted: boolean) => ({
      orderId: physical.id,
      revision: 1,
      accepted,
      invoiceAttached: false,
      invoiceKey: null,
      received: false,
      tracking: null,
      labels: [],
    });

    expect(sellerOrderStatus(physical, shipping(false))).toBe("awaiting");
    expect(sellerOrderStatus(physical, shipping(true))).toBe("accepted");
    // Sem o envio lido, segue como aceito (pago).
    expect(sellerOrderStatus(physical)).toBe("accepted");
    expect(
      summarizeSellerOrders([physical], NOW, {
        [physical.id]: shipping(false),
      }).counts.awaiting,
    ).toBe(1);
  });
});

describe("summarizeSellerOrders", () => {
  it("conta por status, no mês corrente e com problema", () => {
    const summary = summarizeSellerOrders(
      [
        checkout(),
        checkout({
          status: "awaitingPayment",
          createdAt: seconds("2026-10-01T08:00:00"),
        }),
        checkout({ cancellationStatus: "barrierPending" }),
        checkout({ compensationStatus: "creditPending", createdAt: null }),
        legacy(),
      ],
      NOW,
    );

    expect(summary.counts).toEqual({
      awaiting: 2,
      accepted: 3,
      rejected: 0,
      expired: 0,
    });
    // O antigo é de agosto e um dos pedidos não tem data.
    expect(summary.monthTotal).toBe(3);
    expect(summary.withIssue).toBe(2);
  });
});

describe("sellerOrderHasSpecification", () => {
  const spec = { id: "spec-1", name: "Fibra empresarial" };

  it("checkout compara pelo id; antigo, pelo nome", () => {
    expect(sellerOrderHasSpecification(checkout(), spec)).toBe(true);
    expect(sellerOrderHasSpecification(legacy(), spec)).toBe(true);
    expect(
      sellerOrderHasSpecification(legacy(), { id: "x", name: "Outra" }),
    ).toBe(false);
  });
});
