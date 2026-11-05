import { describe, expect, it, vi } from "vitest";

import DirectProposalCard from "@/components/DirectProposalCard";
import type { DirectProposal } from "@/types/proposals";

import { renderWithProviders, screen } from "../test-utils";

const PROPOSAL: DirectProposal = {
  id: "PROP-D-001",
  version: 1,
  offeringId: "offering-1",
  seller: {
    name: "SpeedLine Telecom",
    taxId: "11.222.333/0001-44",
    kycVerified: true,
  },
  productName: "Link Dedicado 200 Mbps",
  category: "connectivity",
  price: { amount: 1850, currency: "BRL" },
  sla: "99,9% de disponibilidade",
  deliveryBusinessDays: 21,
  validityDays: 7,
  cancellationPolicy: "30 dias corridos.",
  sentAt: "2026-07-07T13:30:00.000Z",
  expiresAt: "2026-07-14T13:30:00.000Z",
  status: "awaiting",
  progress: 60,
};

function renderCard(proposal: DirectProposal) {
  const handlers = {
    onView: vi.fn(),
    onRevise: vi.fn(),
    onCancel: vi.fn(),
    onViewOrder: vi.fn(),
  };
  const result = renderWithProviders(
    <DirectProposalCard proposal={proposal} locale="pt-BR" {...handlers} />,
  );
  return { ...result, ...handlers };
}

describe("DirectProposalCard", () => {
  it("aguardando: mostra preço, andamento e as ações de revisar e cancelar", async () => {
    const { user, onRevise, onView, onCancel } = renderCard(PROPOSAL);

    expect(screen.getByText("SpeedLine Telecom")).toBeVisible();
    expect(screen.getByText("SP")).toBeVisible();
    // O Testing Library normaliza o espaço não separável do Intl.
    expect(screen.getByText("R$ 1.850,00")).toBeVisible();
    expect(screen.getByText("Proposals.direct.status.awaiting")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
    );

    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.actions.revise/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.actions.view/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.actions.cancel/ }),
    );
    expect(onRevise).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("revisão solicitada: destaca a versão e a mensagem do seller", () => {
    renderCard({
      ...PROPOSAL,
      version: 2,
      status: "revisionRequested",
      progress: undefined,
      sellerMessage: "Poderia flexibilizar o prazo?",
    });

    expect(screen.getByText("Proposals.direct.card.version")).toBeVisible();
    expect(screen.getByText("Poderia flexibilizar o prazo?")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("aceita: leva ao pedido e não permite revisar nem cancelar", async () => {
    const { user, onViewOrder } = renderCard({
      ...PROPOSAL,
      status: "accepted",
      progress: 100,
    });

    await user.click(
      screen.getByRole("button", {
        name: /Proposals.direct.actions.viewOrder/,
      }),
    );
    expect(onViewOrder).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /Proposals.direct.actions.revise/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Proposals.direct.actions.cancel/ }),
    ).not.toBeInTheDocument();
  });

  it("recusada: oferece nova proposta para a mesma oferta", () => {
    renderCard({ ...PROPOSAL, status: "rejected", progress: undefined });

    expect(
      screen.getByRole("link", {
        name: /Proposals.direct.actions.newProposal/,
      }),
    ).toHaveAttribute("href", "/proposals/new?offeringId=offering-1");
  });
});
