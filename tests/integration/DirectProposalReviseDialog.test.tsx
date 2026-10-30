import { describe, expect, it, vi } from "vitest";

import DirectProposalReviseDialog from "@/components/DirectProposalReviseDialog";
import type { DirectProposal } from "@/types/proposals";

import { renderWithProviders, screen, waitFor } from "../test-utils";

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
  notes: "IP fixo incluso.",
  sentAt: "2026-07-07T13:30:00.000Z",
  expiresAt: "2026-07-14T13:30:00.000Z",
  status: "awaiting",
};

function renderDialog() {
  const onSubmit = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();
  const result = renderWithProviders(
    <DirectProposalReviseDialog
      proposal={PROPOSAL}
      locale="pt-BR"
      isPending={false}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
  return { ...result, onSubmit, onClose };
}

describe("DirectProposalReviseDialog", { timeout: 20_000 }, () => {
  it("parte das condições atuais e confirma antes de enviar a nova versão", async () => {
    const { user, onSubmit, onClose } = renderDialog();

    expect(
      await screen.findByText("Proposals.direct.revise.title"),
    ).toBeVisible();
    expect(screen.getByLabelText(/Proposals.direct.revise.price/)).toHaveValue(
      "1.850,00",
    );

    const sla = screen.getByLabelText(/Proposals.direct.revise.sla/);
    await user.clear(sla);
    await user.type(sla, "99,95% de disponibilidade");
    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.revise.next/ }),
    );

    expect(
      await screen.findByText("Proposals.direct.revise.confirmTitle"),
    ).toBeVisible();
    expect(screen.getByText("99,95% de disponibilidade")).toBeVisible();
    expect(
      screen.getByText("Proposals.direct.revise.versionChange"),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.revise.confirm$/ }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      price: 1850,
      sla: "99,95% de disponibilidade",
      deliveryBusinessDays: 21,
      cancellationPolicy: "30 dias corridos.",
      notes: "IP fixo incluso.",
    });
  });

  it("não segue sem SLA e volta da confirmação com o rascunho", async () => {
    const { user, onSubmit } = renderDialog();

    const sla = await screen.findByLabelText(/Proposals.direct.revise.sla/);
    await user.clear(sla);
    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.revise.next/ }),
    );
    expect(await screen.findByText("Proposals.errors.required")).toBeVisible();

    await user.type(sla, "SLA novo");
    await user.click(
      screen.getByRole("button", { name: /Proposals.direct.revise.next/ }),
    );
    await screen.findByText("Proposals.direct.revise.confirmTitle");
    await user.click(
      screen.getByRole("button", { name: "Proposals.dialog.back" }),
    );

    expect(
      await screen.findByLabelText(/Proposals.direct.revise.sla/),
    ).toHaveValue("SLA novo");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
