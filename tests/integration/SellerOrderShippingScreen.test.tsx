import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderDetailScreen from "@/components/OrderDetailScreen";
import { toaster } from "@/components/ui/toaster";
import { ValidationError } from "@/services/errors";
import {
  ordersService,
  type CheckoutOrder,
  type OrderShipping,
} from "@/services/orders.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/orders.service", async (original) => ({
  ...(await original<typeof import("@/services/orders.service")>()),
  ordersService: {
    getOrder: vi.fn(),
    getShipping: vi.fn(),
    acceptShipping: vi.fn(),
    attachInvoice: vi.fn(),
    informTracking: vi.fn(),
    downloadLabel: vi.fn(),
    downloadInvoice: vi.fn(),
  },
}));

vi.mock("@/contexts/SessionContext", () => ({
  useSession: () => ({
    profile: {
      email: "expedicao@conecta.com.br",
      organization: { id: "8b2e4c1a-7d3f-4a9e-b6c2-1e5f9a3d7c28" },
    },
  }),
}));

vi.mock("@/hooks/useOrganizationAddress", () => ({
  useOrganizationAddress: () => ({ address: null, isLoading: false }),
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}));

const ORDER: CheckoutOrder = {
  id: "1a5e9c3f-7b2d-4e8a-9c4f-6b1d8e3a7c25",
  orderId: "1a5e9c3f-7b2d-4e8a-9c4f-6b1d8e3a7c25",
  checkoutId: "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53",
  createdAt: 1793368931,
  buyerOrganizationId: "3f6d2a8e-1c4b-4e7a-9b1d-5a2c8e7f4b10",
  sellerOrganizationId: "8b2e4c1a-7d3f-4a9e-b6c2-1e5f9a3d7c28",
  status: "accepted",
  items: [
    {
      catalog: {
        offeringId: "offer-1",
        name: "Roteador Wi-Fi 6",
        productType: "physical",
        shippingPolicy: { automaticTracking: false },
      },
      quantity: 2,
      totalMinor: 85980,
      productSubtotalMinor: 77980,
      shippingMode: "delivery",
    },
  ],
  totalMinor: 85980,
  walletMinor: 0,
  cardMinor: 85980,
  platformFeeMinor: 9000,
  currency: "BRL",
  contractId: null,
  executionReleased: false,
  paidMinor: 85980,
  creditedMinor: 0,
  reservationStatus: "not_required",
  cancellationStatus: "not_requested",
  compensationStatus: "not_required",
};

const SHIPPING: OrderShipping = {
  orderId: ORDER.id,
  revision: 1,
  accepted: false,
  invoiceAttached: false,
  invoiceKey: null,
  received: false,
  tracking: null,
  labels: [],
};

function renderScreen() {
  return renderWithProviders(
    <OrderDetailScreen
      orderId={ORDER.id}
      perspective="seller"
      backHref="/seller/orders"
      backLabel="Voltar aos pedidos"
    />,
  );
}

const invoiceCard = () =>
  screen.getByRole("region", { name: "OrderDetail.invoice.title" });

describe("detalhe do pedido · envio do Seller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ordersService.getOrder).mockResolvedValue(ORDER);
  });

  it("aceitar troca o envio na tela e libera anexar a NF", async () => {
    vi.mocked(ordersService.getShipping).mockResolvedValue(SHIPPING);
    vi.mocked(ordersService.acceptShipping).mockResolvedValue({
      ...SHIPPING,
      revision: 2,
      accepted: true,
    });
    const { user } = renderScreen();

    await user.click(
      await screen.findByRole("button", {
        name: "OrderShipping.actions.accept",
      }),
    );

    expect(ordersService.acceptShipping).toHaveBeenCalledWith(ORDER.id);
    expect(
      await within(invoiceCard()).findByRole("button", {
        name: "OrderShipping.actions.attachInvoice",
      }),
    ).toBeInTheDocument();
    expect(toaster.create).toHaveBeenCalledWith({
      type: "success",
      title: "OrderShipping.success.accepted",
    });
  });

  it("informa o rastreio pelo modal e mostra o código", async () => {
    const withInvoice = {
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
    };
    vi.mocked(ordersService.getShipping).mockResolvedValue(withInvoice);
    vi.mocked(ordersService.informTracking).mockResolvedValue({
      ...withInvoice,
      tracking: "AD284719305BR",
    });
    const { user } = renderScreen();

    await user.click(
      await screen.findByRole("button", {
        name: "OrderShipping.actions.informTracking",
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/OrderShipping\.tracking\.label/),
      "AD284719305BR",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "OrderShipping.tracking.submit",
      }),
    );

    expect(ordersService.informTracking).toHaveBeenCalledWith(
      ORDER.id,
      "AD284719305BR",
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(invoiceCard()).toHaveTextContent("AD284719305BR");
  });

  it("recusa da orders-api mostra o motivo e mantém o modal", async () => {
    vi.mocked(ordersService.getShipping).mockResolvedValue({
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
    });
    vi.mocked(ordersService.informTracking).mockRejectedValue(
      new ValidationError(422, [], undefined, {
        detail: "Tracking requires an active paid order and invoice",
      }),
    );
    const { user } = renderScreen();

    await user.click(
      await screen.findByRole("button", {
        name: "OrderShipping.actions.informTracking",
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/OrderShipping\.tracking\.label/),
      "AD284719305BR",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "OrderShipping.tracking.submit",
      }),
    );

    await waitFor(() =>
      expect(toaster.create).toHaveBeenCalledWith({
        type: "error",
        title: "OrderShipping.errors.rejected",
        description: "Tracking requires an active paid order and invoice",
      }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("o modal da NF já vem com o valor dos produtos e o e-mail da sessão", async () => {
    vi.mocked(ordersService.getShipping).mockResolvedValue({
      ...SHIPPING,
      accepted: true,
    });
    const { user } = renderScreen();

    await user.click(
      await screen.findByRole("button", {
        name: "OrderShipping.actions.attachInvoice",
      }),
    );
    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByLabelText(/OrderShipping\.invoice\.fields\.value/),
    ).toHaveValue("779,80");
    expect(
      within(dialog).getByLabelText(
        /OrderShipping\.invoice\.fields\.senderEmail/,
      ),
    ).toHaveValue("expedicao@conecta.com.br");
  });
});
