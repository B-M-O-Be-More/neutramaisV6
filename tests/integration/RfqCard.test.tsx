import { describe, expect, it, vi } from "vitest";

import RfqCard from "@/components/RfqCard";
import type { Rfq } from "@/types/proposals";

import { renderWithProviders, screen } from "../test-utils";

const NOW = new Date("2026-07-07T12:00:00.000Z").getTime();

const RFQ: Rfq = {
  id: "RFQ-2024-001",
  category: "connectivity",
  productName: "Link Dedicado 500 Mbps",
  description: "Link dedicado full duplex.",
  location: "São Paulo/SP",
  budget: "",
  responseHours: 72,
  urgent: false,
  requirements: "",
  createdAt: "2026-07-05T12:00:00.000Z",
  deadlineAt: "2026-07-08T06:00:00.000Z",
  status: "proposalReceived",
  notifiedSellers: 12,
  proposalsReceived: 7,
  bestProposal: { amount: 2890, currency: "BRL" },
};

function renderCard(rfq: Rfq) {
  const onAction = vi.fn();
  const result = renderWithProviders(
    <RfqCard rfq={rfq} locale="pt-BR" now={NOW} onAction={onAction} />,
  );
  return { ...result, onAction };
}

const exportButton = () =>
  screen.queryByRole("button", { name: "Proposals.rfq.actions.export" });

describe("RfqCard (Figma 2037-15640)", () => {
  it("exporta a RFQ ao lado de cancelar", async () => {
    const { user, onAction } = renderCard(RFQ);

    expect(
      screen.getByRole("button", { name: "Proposals.rfq.actions.cancel" }),
    ).toBeInTheDocument();
    await user.click(exportButton()!);

    expect(onAction).toHaveBeenCalledWith("export");
  });

  it("expirada exporta, mas não cancela", () => {
    renderCard({ ...RFQ, status: "expired", bestProposal: undefined });

    expect(exportButton()).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Proposals.rfq.actions.cancel" }),
    ).not.toBeInTheDocument();
  });

  it("convertida em pedido leva só ao pedido gerado", () => {
    renderCard({ ...RFQ, status: "converted", orderId: "PED-1" });

    expect(exportButton()).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Proposals.rfq.actions.viewOrder/ }),
    ).toBeInTheDocument();
  });
});
