import { describe, expect, it, vi } from "vitest";

import OrderDetail, { type OrderDetailProps } from "@/components/OrderDetail";
import { sellerShippingActions } from "@/functions/orderShipping";
import type { CheckoutOrder, OrderShipping } from "@/services/orders.service";

import { renderWithProviders, screen, within } from "../test-utils";

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
      catalog: {
        offeringId: "offer-1",
        name: "Link Dedicado 500 Mbps",
        productType: "service",
        specification: { id: "spec-1", name: "Link dedicado em fibra" },
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
  snapshot: { platformFeeBps: 750 },
  contractId: "c41a7e2d-9b3f-4d8a-a1e6-2f7b5c9d3e84",
  executionReleased: true,
  paidMinor: 399000,
  creditedMinor: 0,
  reservationStatus: "reserved",
  cancellationStatus: "not_requested",
  compensationStatus: "not_required",
};

function renderDetail(overrides: Partial<OrderDetailProps> = {}) {
  return renderWithProviders(
    <OrderDetail
      order={ORDER}
      shipping={null}
      perspective="seller"
      locale="pt-BR"
      backHref="/seller/orders"
      backLabel="Voltar aos pedidos"
      isDownloadingInvoice={false}
      onDownloadInvoice={vi.fn()}
      {...overrides}
    />,
  );
}

describe("OrderDetail", () => {
  it("Seller vê o comprador, a etapa e quanto recebe", () => {
    renderDetail();

    expect(
      screen.getByRole("heading", { name: "Link Dedicado 500 Mbps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar aos pedidos" }),
    ).toHaveAttribute("href", "/seller/orders");
    expect(
      screen.getByRole("region", {
        name: "OrderDetail.counterparty.title.seller",
      }),
    ).toHaveTextContent(ORDER.buyerOrganizationId);
    expect(screen.getAllByText("OrderDetail.stages.inExecution")).toHaveLength(
      2,
    );
    expect(
      screen.getByText("OrderDetail.captions.seller.inExecution"),
    ).toBeInTheDocument();

    const value = screen.getByRole("region", {
      name: "OrderDetail.value.title",
    });
    expect(
      within(value).getByText("OrderDetail.value.net"),
    ).toBeInTheDocument();
    // R$ 3.990,00 − R$ 299,25 da taxa.
    expect(within(value).getByText(/3\.690,75/)).toBeInTheDocument();
    // Serviço: contrato, sem nota fiscal.
    expect(
      screen.getByRole("region", { name: "OrderDetail.contract.title" }),
    ).toHaveTextContent(ORDER.contractId!);
    expect(
      screen.queryByRole("region", { name: "OrderDetail.invoice.title" }),
    ).not.toBeInTheDocument();
  });

  it("Buyer vê o provedor e o link para os contratos", () => {
    renderDetail({
      perspective: "buyer",
      backHref: "/dashboard",
      contractsHref: "/contracts",
    });

    expect(
      screen.getByRole("region", {
        name: "OrderDetail.counterparty.title.buyer",
      }),
    ).toHaveTextContent(ORDER.sellerOrganizationId);
    expect(
      screen.getByRole("link", { name: "OrderDetail.contract.goTo" }),
    ).toHaveAttribute("href", "/contracts");
    expect(screen.queryByText("OrderDetail.value.net")).not.toBeInTheDocument();
  });

  it("pedido físico mostra a NF e baixa o PDF", async () => {
    const onDownloadInvoice = vi.fn();
    const shipping: OrderShipping = {
      orderId: ORDER.id,
      revision: 2,
      accepted: true,
      invoiceAttached: true,
      invoiceKey: "23261012345678000195550010000045121482139073",
      received: false,
      tracking: null,
      labels: [{ id: "label-1", status: "ready", tracking: "AD284719305BR" }],
    };
    const { user } = renderDetail({
      perspective: "buyer",
      shipping,
      onDownloadInvoice,
      order: {
        ...ORDER,
        items: [
          {
            ...ORDER.items[0],
            catalog: { ...ORDER.items[0].catalog, productType: "physical" },
          },
        ],
      },
    });

    const invoice = screen.getByRole("region", {
      name: "OrderDetail.invoice.title",
    });
    expect(invoice).toHaveTextContent(shipping.invoiceKey!);
    expect(invoice).toHaveTextContent("AD284719305BR");
    await user.click(
      within(invoice).getByRole("button", {
        name: "OrderDetail.invoice.download",
      }),
    );
    expect(onDownloadInvoice).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("region", { name: "OrderDetail.contract.title" }),
    ).not.toBeInTheDocument();
  });
});

describe("OrderDetail · ações de envio do Seller", () => {
  const PHYSICAL: CheckoutOrder = {
    ...ORDER,
    items: [
      {
        ...ORDER.items[0],
        catalog: {
          ...ORDER.items[0].catalog,
          productType: "physical",
          shippingPolicy: { automaticTracking: false },
        },
        productSubtotalMinor: 399000,
        shippingMode: "delivery",
      },
    ],
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
  const handlers = () => ({
    onAccept: vi.fn(),
    onAttachInvoice: vi.fn(),
    onInformTracking: vi.fn(),
    onPrintLabel: vi.fn(),
  });

  function renderSeller(shipping: OrderShipping, pending = null) {
    const callbacks = handlers();
    const view = renderDetail({
      order: PHYSICAL,
      shipping,
      sellerShipping: {
        actions: sellerShippingActions(PHYSICAL, shipping),
        pending,
        ...callbacks,
      },
    });
    const invoice = screen.getByRole("region", {
      name: "OrderDetail.invoice.title",
    });
    return { ...view, callbacks, invoice };
  }

  it("pedido pago sem aceite: só o botão de aceitar", async () => {
    const { user, callbacks, invoice } = renderSeller(SHIPPING);

    expect(invoice).toHaveTextContent("OrderShipping.accepted.no");
    expect(
      within(invoice).queryByRole("button", {
        name: "OrderShipping.actions.attachInvoice",
      }),
    ).not.toBeInTheDocument();
    await user.click(
      within(invoice).getByRole("button", {
        name: "OrderShipping.actions.accept",
      }),
    );
    expect(callbacks.onAccept).toHaveBeenCalledOnce();
  });

  it("aceito: anexar a NF; com NF: trocar NF, informar rastreio e baixar", async () => {
    const accepted = renderSeller({ ...SHIPPING, accepted: true });
    await accepted.user.click(
      within(accepted.invoice).getByRole("button", {
        name: "OrderShipping.actions.attachInvoice",
      }),
    );
    expect(accepted.callbacks.onAttachInvoice).toHaveBeenCalledOnce();
    expect(
      within(accepted.invoice).queryByRole("button", {
        name: "OrderShipping.actions.informTracking",
      }),
    ).not.toBeInTheDocument();
    accepted.unmount();

    const { user, callbacks, invoice } = renderSeller({
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
      invoiceKey: "23261012345678000195550010000045121482139073",
    });
    expect(
      within(invoice).getByRole("button", {
        name: "OrderShipping.actions.replaceInvoice",
      }),
    ).toBeInTheDocument();
    expect(
      within(invoice).getByRole("button", {
        name: "OrderDetail.invoice.download",
      }),
    ).toBeInTheDocument();
    await user.click(
      within(invoice).getByRole("button", {
        name: "OrderShipping.actions.informTracking",
      }),
    );
    expect(callbacks.onInformTracking).toHaveBeenCalledOnce();
  });

  it("etiqueta pronta: imprime pelo id e mostra a situação de cada uma", async () => {
    const { user, callbacks, invoice } = renderSeller({
      ...SHIPPING,
      accepted: true,
      invoiceAttached: true,
      labels: [
        { id: "label-1", status: "ready", tracking: null },
        {
          id: "label-2",
          status: "checkout_unknown",
          tracking: null,
          attentionRequired: true,
        },
      ],
    });

    expect(invoice).toHaveTextContent("OrderShipping.labels.status.ready");
    expect(invoice).toHaveTextContent("OrderShipping.labels.status.unknown");
    expect(invoice).toHaveTextContent("OrderShipping.labels.attention");
    // A compra já começou: a NF não pode mais ser trocada.
    expect(
      within(invoice).queryByRole("button", {
        name: "OrderShipping.actions.replaceInvoice",
      }),
    ).not.toBeInTheDocument();
    await user.click(
      within(invoice).getByRole("button", {
        name: "OrderShipping.actions.printLabel",
      }),
    );
    expect(callbacks.onPrintLabel).toHaveBeenCalledWith("label-1");
  });

  it("Buyer não vê as ações do Seller", () => {
    renderDetail({
      order: PHYSICAL,
      perspective: "buyer",
      shipping: { ...SHIPPING, accepted: true },
    });

    expect(
      screen.queryByRole("button", { name: "OrderShipping.actions.accept" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "OrderShipping.actions.attachInvoice",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("OrderShipping.accepted.no"),
    ).not.toBeInTheDocument();
  });
});
