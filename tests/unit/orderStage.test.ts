import { describe, expect, it } from "vitest";

import {
  orderEscrowStatus,
  orderProgress,
  orderStage,
} from "@/functions/orderStage";
import type { CheckoutOrder, LegacyOrder } from "@/services/orders.service";

function checkout(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    id: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
    orderId: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
    checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
    createdAt: 1793368931,
    buyerOrganizationId: "buyer",
    sellerOrganizationId: "seller",
    status: "accepted",
    items: [
      {
        catalog: {
          offeringId: "offer-1",
          name: "Link Dedicado 500 Mbps",
          productType: "service",
        },
        quantity: 1,
        totalMinor: 399000,
      },
    ],
    totalMinor: 399000,
    walletMinor: 50000,
    cardMinor: 349000,
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

const legacy = (status: LegacyOrder["status"]): LegacyOrder => ({
  id: "0b7d3f9a-2e6c-4a1d-8f5b-4c9e1a7d3f26",
  buyerOrganizationId: "buyer",
  sellerOrganizationId: "seller",
  status,
  items: [],
  totalMonthly: 899.9,
  totalInstallation: 0,
  createdAt: null,
});

describe("orderStage", () => {
  it.each([
    [checkout({ status: "awaitingPayment" }), "awaitingPayment"],
    [checkout(), "awaitingContract"],
    [checkout({ executionReleased: true }), "inExecution"],
    [checkout({ status: "cancelled" }), "cancelled"],
    [legacy("pending"), "awaitingAcceptance"],
    [legacy("accepted"), "inExecution"],
    [legacy("completed"), "completed"],
    [legacy("rejected"), "rejected"],
  ])("%# → %s", (order, stage) => {
    expect(orderStage(order)).toBe(stage);
  });

  it("produto físico pago segue para o envio, sem contrato", () => {
    const physical = checkout({
      items: [
        {
          catalog: { offeringId: "o", name: "ONU", productType: "physical" },
          quantity: 1,
          totalMinor: 10000,
        },
      ],
    });
    expect(orderStage(physical)).toBe("inExecution");
  });
});

describe("orderProgress", () => {
  it("marca os passos concluídos e o atual", () => {
    expect(orderProgress("awaitingPayment")).toEqual({ done: 1, current: 1 });
    expect(orderProgress("inExecution")).toEqual({ done: 3, current: 3 });
    expect(orderProgress("completed")).toEqual({ done: 4, current: null });
    expect(orderProgress("cancelled")).toEqual({ done: 1, current: null });
  });
});

describe("orderEscrowStatus", () => {
  it("segue o pagamento e a devolução", () => {
    expect(orderEscrowStatus(checkout({ status: "awaitingPayment" }))).toBe(
      "awaitingPayment",
    );
    expect(orderEscrowStatus(checkout())).toBe("held");
    expect(
      orderEscrowStatus(
        checkout({
          status: "cancelled",
          compensationStatus: "creditedToWallet",
        }),
      ),
    ).toBe("refunded");
    expect(orderEscrowStatus(legacy("pending"))).toBeNull();
  });
});
