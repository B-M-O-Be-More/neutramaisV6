import { describe, expect, it, vi } from "vitest";

import SellerOrderCard from "@/components/SellerOrderCard";
import SellerOrderComplementDialog from "@/components/SellerOrderComplementDialog";
import SellerRfqCard from "@/components/SellerRfqCard";
import type { LegacyOrder } from "@/services/orders.service";
import type { SellerRfq } from "@/types/sellerRfqs";

import { renderWithProviders, screen, within } from "../test-utils";

const NOW = new Date("2026-10-30T12:00:00Z").getTime();

const pendingOrder: LegacyOrder = {
  id: "0b7d3f9a-2e6c-4a1d-8f5b-4c9e1a7d3f26",
  buyerOrganizationId: "buyer",
  sellerOrganizationId: "seller",
  status: "pending",
  items: [
    {
      id: "item-1",
      offeringId: "offer-1",
      offeringName: "Internet Fibra Premium 500 Mbps",
      specificationName: "Fibra empresarial",
      monthlyPrice: 109.99,
      installationPrice: 0,
      quantity: 1,
    },
  ],
  totalMonthly: 109.99,
  totalInstallation: 0,
  createdAt: "2026-10-29T10:32:00-03:00",
};

function renderOrderCard(overrides: Partial<LegacyOrder> = {}) {
  const props = {
    onAccept: vi.fn(),
    onReject: vi.fn().mockResolvedValue(true),
    onRequestComplement: vi.fn(),
  };
  const view = renderWithProviders(
    <SellerOrderCard
      order={{ ...pendingOrder, ...overrides }}
      locale="pt-BR"
      href="/seller/orders/x"
      isAccepting={false}
      isRejecting={false}
      {...props}
    />,
  );
  return { ...view, ...props };
}

const sentRfq: SellerRfq = {
  id: "RFQ-2026-EXT-039",
  productName: "Dark Fiber 80km",
  buyer: { name: "FastNet ISP ME", taxId: "77.888.999/0001-55" },
  location: "Fortaleza/CE — Caucaia/CE (80km)",
  description: "IRU de dark fiber entre Fortaleza e Caucaia.",
  receivedAt: new Date(NOW - 48 * 3600_000).toISOString(),
  deadlineAt: new Date(NOW + 24 * 3600_000).toISOString(),
  status: "proposalSent",
  proposal: {
    price: { amount: 28000, currency: "BRL" },
    sla: "99,5%",
    deliveryDays: 90,
    validityDays: 15,
    requiresSiteSurvey: true,
    notes: "",
    version: 1,
  },
};

function renderRfqCard(rfq: SellerRfq) {
  const props = {
    onSendProposal: vi.fn().mockResolvedValue(true),
    onDecline: vi.fn().mockResolvedValue(true),
    onViewOrder: vi.fn(),
  };
  const view = renderWithProviders(
    <SellerRfqCard
      rfq={rfq}
      locale="pt-BR"
      now={NOW}
      isPending={false}
      {...props}
    />,
  );
  return { ...view, ...props };
}

describe("Pedido na caixa de entrada do seller", () => {
  it("aguardando: aceita, pede complemento e recusa com motivo obrigatório", async () => {
    const { user, onAccept, onReject, onRequestComplement } = renderOrderCard();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.actions.accept" }),
    );
    expect(onAccept).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.actions.complement" }),
    );
    expect(onRequestComplement).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.actions.reject" }),
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.reject.confirm" }),
    );
    expect(
      await screen.findByText("SellerOrders.errors.reasonRequired"),
    ).toBeInTheDocument();
    expect(onReject).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText("SellerOrders.reject.title"),
      "Fora da área de cobertura",
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.reject.confirm" }),
    );
    expect(onReject).toHaveBeenCalledWith("Fora da área de cobertura");
    // Recusa confirmada fecha o painel do motivo.
    expect(
      screen.queryByLabelText("SellerOrders.reject.title"),
    ).not.toBeInTheDocument();
  });

  it("recusado: sem ações, com o aviso no rodapé e detalhes sob demanda", async () => {
    const { user } = renderOrderCard({
      status: "rejected",
      rejectionReason: "Capacidade esgotada SP",
    });

    expect(
      screen.queryByRole("button", { name: "SellerOrders.actions.accept" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Capacidade esgotada SP")).toBeInTheDocument();
    expect(
      screen.getByText("SellerOrders.card.footer.rejected"),
    ).toBeInTheDocument();

    const toggle = screen.getByRole("button", {
      name: "SellerOrders.details.show",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(
      screen.getByText("SellerOrders.details.timeline.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "SellerOrders.details.open" }),
    ).toHaveAttribute("href", "/seller/orders/x");
  });
});

describe("Pedir complemento", () => {
  it("a sugestão entra no texto e o envio exige 20 caracteres", async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <SellerOrderComplementDialog
        subtitle="Pedido #0B7D3F9A · Internet Fibra"
        isPending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Pedido #0B7D3F9A · Internet Fibra"),
    ).toBeInTheDocument();

    const field = within(dialog).getByLabelText(
      /SellerOrders\.complement\.label/,
    );
    await user.type(field, "Curto");
    await user.click(
      within(dialog).getByRole("button", {
        name: "SellerOrders.complement.submit",
      }),
    );
    expect(
      await within(dialog).findByText("SellerOrders.errors.complementTooShort"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", {
        name: "SellerOrders.complement.suggestions.duct",
      }),
    );
    expect(field).toHaveValue(
      "Curto\nSellerOrders.complement.suggestions.duct",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "SellerOrders.complement.submit",
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      { message: "Curto\nSellerOrders.complement.suggestions.duct" },
      expect.anything(),
    );
  });
});

describe("RFQ recebida pelo seller", () => {
  it("proposta enviada: mostra o resumo e atualiza para a nova versão", async () => {
    const { user, onSendProposal } = renderRfqCard(sentRfq);

    expect(screen.getByText("SellerOrders.rfq.siteSurvey")).toBeInTheDocument();
    expect(
      screen.getByText("SellerOrders.rfq.proposal.price"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.updateProposal" }),
    );
    const sla = screen.getByLabelText(/SellerOrders\.rfq\.form\.sla/);
    expect(sla).toHaveValue("99,5%");
    await user.clear(sla);
    await user.type(sla, "99,9%");
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.form.submit" }),
    );

    expect(onSendProposal).toHaveBeenCalledWith({
      price: { amount: 28000, currency: "BRL" },
      sla: "99,9%",
      deliveryDays: 90,
      validityDays: 15,
      requiresSiteSurvey: true,
      notes: "",
    });
  });

  it("aguardando: o formulário valida os campos e a recusa pede justificativa", async () => {
    const { user, onSendProposal, onDecline } = renderRfqCard({
      ...sentRfq,
      status: "awaiting",
      proposal: undefined,
    });

    expect(screen.getByText("SellerOrders.rfq.hoursLeft")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.form.title" }),
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.form.submit" }),
    );
    expect(
      await screen.findAllByText("SellerOrders.errors.required"),
    ).not.toHaveLength(0);
    expect(onSendProposal).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.form.close" }),
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.rfq.decline" }),
    );
    await user.type(
      screen.getByLabelText("SellerOrders.rfq.declineForm.title"),
      "Sem capacidade no prazo",
    );
    await user.click(
      screen.getByRole("button", {
        name: "SellerOrders.rfq.declineForm.confirm",
      }),
    );
    expect(onDecline).toHaveBeenCalledWith("Sem capacidade no prazo");
  });
});
