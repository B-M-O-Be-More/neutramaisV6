import { describe, expect, it } from "vitest";

import {
  filterBuyerOrders,
  summarizeBuyerOrders,
} from "@/functions/buyerOrders";
import type { CheckoutOrder, LegacyOrder } from "@/services/orders.service";

const base: CheckoutOrder = {
  id: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
  orderId: "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16",
  checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
  createdAt: 1793368931,
  buyerOrganizationId: "3f6d2a8e-1c4b-4e7a-9b1d-5a2c8e7f4b10",
  sellerOrganizationId: "8b2e4c1a-7d3f-4a9e-b6c2-1e5f9a3d7c28",
  status: "accepted",
  items: [
    {
      catalog: { offeringId: "o1", name: "Link Dedicado 500 Mbps" },
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
  executionReleased: true,
  paidMinor: 399000,
  creditedMinor: 0,
  reservationStatus: "not_required",
  cancellationStatus: "not_requested",
  compensationStatus: "not_required",
};

const awaitingPayment: CheckoutOrder = {
  ...base,
  id: "aa000000-0000-4000-8000-000000000001",
  status: "awaitingPayment",
};
const cancelling: CheckoutOrder = {
  ...base,
  id: "bb000000-0000-4000-8000-000000000002",
  cancellationStatus: "barrierPending",
};
const refunded: CheckoutOrder = {
  ...base,
  id: "cc000000-0000-4000-8000-000000000003",
  status: "cancelled",
  compensationStatus: "creditPending",
};
const legacy: LegacyOrder = {
  id: "dd000000-0000-4000-8000-000000000004",
  buyerOrganizationId: base.buyerOrganizationId,
  sellerOrganizationId: "11110000-0000-4000-8000-000000000000",
  status: "completed",
  items: [
    {
      id: "i1",
      offeringId: "o9",
      offeringName: "Trânsito IP 1 Gbps",
      specificationName: null,
      monthlyPrice: 900,
      installationPrice: 0,
      quantity: 1,
    },
  ],
  totalMonthly: 900,
  totalInstallation: 0,
  createdAt: "2026-05-02T10:00:00-03:00",
};

const ALL = [base, awaitingPayment, cancelling, refunded, legacy];

describe("Meus Pedidos", () => {
  it("conta total, em andamento, em escrow e em cancelamento", () => {
    expect(summarizeBuyerOrders(ALL)).toEqual({
      total: 5,
      // Ativo, aguardando pagamento e em cancelamento (ainda não cancelado).
      inProgress: 3,
      // Pagos e não cancelados: o dinheiro está retido.
      inEscrow: 2,
      inCancellation: 2,
    });
    expect(summarizeBuyerOrders([])).toEqual({
      total: 0,
      inProgress: 0,
      inEscrow: 0,
      inCancellation: 0,
    });
  });

  it("busca por produto, nos dois formatos de pedido", () => {
    expect(filterBuyerOrders(ALL, "link dedicado")).toHaveLength(4);
    expect(filterBuyerOrders(ALL, "trânsito")).toEqual([legacy]);
  });

  it("busca pelo número do pedido, com ou sem #", () => {
    expect(filterBuyerOrders(ALL, "#BB000000")).toEqual([cancelling]);
    expect(filterBuyerOrders(ALL, "cc00")).toEqual([refunded]);
  });

  it("busca pelo início do id do Seller", () => {
    expect(filterBuyerOrders(ALL, "1111")).toEqual([legacy]);
  });

  it("busca vazia devolve todos", () => {
    expect(filterBuyerOrders(ALL, "  ")).toBe(ALL);
  });
});
