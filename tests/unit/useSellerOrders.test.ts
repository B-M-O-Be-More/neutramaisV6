import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSellerOrders } from "@/hooks/useSellerOrders";
import { ConflictError, ForbiddenError, ServerError } from "@/services/errors";
import {
  ordersService,
  type CheckoutOrder,
  type LegacyOrder,
  type OrderShipping,
} from "@/services/orders.service";

vi.mock("@/services/orders.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/orders.service")>()),
  ordersService: {
    listSellerOrders: vi.fn(),
    getShipping: vi.fn(),
    acceptShipping: vi.fn(),
  },
}));

const list = vi.mocked(ordersService.listSellerOrders);
const getShipping = vi.mocked(ordersService.getShipping);
const acceptShipping = vi.mocked(ordersService.acceptShipping);

const PHYSICAL_ID = "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16";

/** Pedido físico já pago (checkout `accepted`). */
const physicalPaid = {
  id: PHYSICAL_ID,
  orderId: PHYSICAL_ID,
  checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
  createdAt: null,
  buyerOrganizationId: "buyer",
  sellerOrganizationId: "seller",
  status: "accepted",
  items: [
    {
      catalog: { offeringId: "ont", name: "ONT", productType: "physical" },
      quantity: 1,
      totalMinor: 50000,
    },
  ],
  totalMinor: 50000,
  walletMinor: 0,
  cardMinor: 50000,
  platformFeeMinor: 0,
  currency: "BRL",
  contractId: null,
  executionReleased: false,
  paidMinor: 50000,
  creditedMinor: 0,
  reservationStatus: "reserved",
  cancellationStatus: "not_requested",
  compensationStatus: "not_required",
} satisfies CheckoutOrder;

const shipping = (accepted: boolean): OrderShipping => ({
  orderId: PHYSICAL_ID,
  revision: accepted ? 2 : 1,
  accepted,
  invoiceAttached: false,
  invoiceKey: null,
  received: false,
  tracking: null,
  labels: [],
});

function orders(count: number, start = 0): LegacyOrder[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `order-${start + index}`,
    buyerOrganizationId: "buyer",
    sellerOrganizationId: "seller",
    status: "pending",
    items: [],
    totalMonthly: 0,
    totalInstallation: 0,
    createdAt: null,
  }));
}

function page(items: LegacyOrder[], totalCount: number) {
  return {
    data: items,
    message: "Orders retrieved",
    metadata: { page: 1, pageSize: 200, totalCount, totalPages: 2 },
  };
}

describe("useSellerOrders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lê todas as páginas de 200 e conta os pedidos", async () => {
    list
      .mockResolvedValueOnce(page(orders(200), 250))
      .mockResolvedValueOnce(page(orders(50, 200), 250));

    const { result } = renderHook(() => useSellerOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[1][0]).toEqual({ offset: 200, limit: 200 });
    expect(result.current.orders).toHaveLength(250);
    expect(result.current.counts.awaiting).toBe(250);
    expect(result.current.errorKey).toBeNull();
  });

  it("lê o envio do físico pago e aceita pelo /shipping/accept", async () => {
    list.mockResolvedValueOnce(page([physicalPaid] as never, 1));
    getShipping.mockResolvedValueOnce(shipping(false));
    acceptShipping.mockResolvedValueOnce(shipping(true));

    const { result } = renderHook(() => useSellerOrders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getShipping).toHaveBeenCalledWith(PHYSICAL_ID, expect.anything());
    expect(result.current.counts.awaiting).toBe(1);

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.accept(PHYSICAL_ID);
    });
    expect(outcome).toBe("accepted");
    expect(result.current.counts).toMatchObject({ awaiting: 0, accepted: 1 });
    expect(result.current.pendingId).toBeNull();
  });

  it("aceite recusado pela orders-api devolve conflict", async () => {
    list.mockResolvedValueOnce(page([physicalPaid] as never, 1));
    getShipping.mockResolvedValueOnce(shipping(false));
    acceptShipping.mockRejectedValueOnce(new ConflictError(409));

    const { result } = renderHook(() => useSellerOrders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.accept(PHYSICAL_ID);
    });
    expect(outcome).toBe("conflict");
    expect(result.current.counts.awaiting).toBe(1);
  });

  it("sem order:read, avisa a falta da permissão", async () => {
    list.mockRejectedValue(new ForbiddenError(403));

    const { result } = renderHook(() => useSellerOrders());

    await waitFor(() =>
      expect(result.current.errorKey).toBe("SellerOrders.errors.forbidden"),
    );
    expect(result.current.orders).toEqual([]);
  });

  it("outra falha permite tentar de novo", async () => {
    list
      .mockRejectedValueOnce(new ServerError(502))
      .mockResolvedValueOnce(page(orders(1), 1));

    const { result } = renderHook(() => useSellerOrders());

    await waitFor(() =>
      expect(result.current.errorKey).toBe("SellerOrders.errors.failed"),
    );
    result.current.reload();
    await waitFor(() => expect(result.current.orders).toHaveLength(1));
    expect(result.current.errorKey).toBeNull();
  });
});
