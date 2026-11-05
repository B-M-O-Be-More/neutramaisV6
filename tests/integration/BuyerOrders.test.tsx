import { beforeEach, describe, expect, it, vi } from "vitest";

import BuyerOrders from "@/components/BuyerOrders";
import { ForbiddenError, ServerError } from "@/services/errors";
import { ordersService, type CheckoutOrder } from "@/services/orders.service";

import { renderWithProviders, screen, within } from "../test-utils";

vi.mock("@/services/orders.service", async (original) => ({
  ...(await original<typeof import("@/services/orders.service")>()),
  ordersService: { listBuyerOrders: vi.fn() },
}));

const ORDER: CheckoutOrder = {
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

const ROUTER: CheckoutOrder = {
  ...ORDER,
  id: "aa000000-0000-4000-8000-000000000001",
  orderId: "aa000000-0000-4000-8000-000000000001",
  status: "awaitingPayment",
  items: [
    {
      catalog: { offeringId: "o2", name: "Roteador Wi-Fi 6" },
      quantity: 2,
      totalMinor: 85980,
    },
  ],
  totalMinor: 85980,
};

const page = (data: CheckoutOrder[], totalCount = data.length) => ({
  data,
  metadata: { page: 1, pageSize: 200, totalCount, totalPages: 1 },
});

describe("BuyerOrders (Meus Pedidos)", () => {
  beforeEach(() => {
    vi.mocked(ordersService.listBuyerOrders).mockReset();
  });

  it("lista os pedidos com os indicadores e o link para o detalhe", async () => {
    vi.mocked(ordersService.listBuyerOrders).mockResolvedValue(
      page([ORDER, ROUTER]) as never,
    );
    renderWithProviders(<BuyerOrders locale="pt-BR" />);

    const link = await screen.findByRole("link", {
      name: "Link Dedicado 500 Mbps",
    });
    expect(link).toHaveAttribute("href", `/orders/${ORDER.id}`);
    expect(screen.getByText("#E2B7D4A9", { exact: false })).toBeInTheDocument();
    expect(ordersService.listBuyerOrders).toHaveBeenCalledWith(
      { offset: 0, limit: 200 },
      expect.anything(),
    );

    const total = screen.getByText("BuyerOrders.stats.total").parentElement!;
    expect(within(total).getByText("2")).toBeInTheDocument();
    const escrow = screen.getByText(
      "BuyerOrders.stats.inEscrow",
    ).parentElement!;
    expect(within(escrow).getByText("1")).toBeInTheDocument();
  });

  it("busca por produto e avisa quando nada bate", async () => {
    vi.mocked(ordersService.listBuyerOrders).mockResolvedValue(
      page([ORDER, ROUTER]) as never,
    );
    const { user } = renderWithProviders(<BuyerOrders locale="pt-BR" />);
    const search = await screen.findByRole("searchbox", {
      name: "BuyerOrders.search",
    });

    await user.type(search, "roteador");
    expect(
      screen.getByRole("link", { name: "Roteador Wi-Fi 6" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Link Dedicado 500 Mbps" }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "fibra apagada");
    expect(screen.getByText("BuyerOrders.emptyFiltered")).toBeInTheDocument();
  });

  it("lê todas as páginas da lista", async () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      ...ORDER,
      id: `${String(index).padStart(8, "0")}-0000-4000-8000-000000000000`,
    }));
    vi.mocked(ordersService.listBuyerOrders)
      .mockResolvedValueOnce(page(many, 201) as never)
      .mockResolvedValueOnce(page([ROUTER], 201) as never);
    renderWithProviders(<BuyerOrders locale="pt-BR" />);

    expect(
      await screen.findByRole("link", { name: "Roteador Wi-Fi 6" }),
    ).toBeInTheDocument();
    expect(ordersService.listBuyerOrders).toHaveBeenLastCalledWith(
      { offset: 200, limit: 200 },
      expect.anything(),
    );
  });

  it("sem pedidos mostra o estado vazio", async () => {
    vi.mocked(ordersService.listBuyerOrders).mockResolvedValue(
      page([]) as never,
    );
    renderWithProviders(<BuyerOrders locale="pt-BR" />);

    expect(await screen.findByText("BuyerOrders.empty")).toBeInTheDocument();
  });

  it("sem order:read mostra o aviso da permissão, sem tentar de novo", async () => {
    vi.mocked(ordersService.listBuyerOrders).mockRejectedValue(
      new ForbiddenError(403),
    );
    renderWithProviders(<BuyerOrders locale="pt-BR" />);

    expect(
      await screen.findByText("BuyerOrders.errors.forbidden"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "BuyerOrders.retry" }),
    ).not.toBeInTheDocument();
  });

  it("falha da API permite tentar de novo", async () => {
    vi.mocked(ordersService.listBuyerOrders)
      .mockRejectedValueOnce(new ServerError(502))
      .mockResolvedValueOnce(page([ORDER]) as never);
    const { user } = renderWithProviders(<BuyerOrders locale="pt-BR" />);

    await user.click(
      await screen.findByRole("button", { name: "BuyerOrders.retry" }),
    );

    expect(
      await screen.findByRole("link", { name: "Link Dedicado 500 Mbps" }),
    ).toBeInTheDocument();
  });
});
