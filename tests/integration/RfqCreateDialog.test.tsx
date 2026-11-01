import { describe, expect, it, vi } from "vitest";

import RfqCreateDialog from "@/components/RfqCreateDialog";
import type { Rfq, RfqDraft } from "@/types/proposals";

import { renderWithProviders, screen, waitFor } from "../test-utils";

function renderDialog(initial?: RfqDraft) {
  const onCreate = vi.fn(
    async (draft: RfqDraft): Promise<Rfq> => ({
      ...draft,
      id: "RFQ-2026-006",
      createdAt: "2026-07-07T13:30:00.000Z",
      deadlineAt: "2026-07-10T13:30:00.000Z",
      status: "awaiting",
      notifiedSellers: 0,
      proposalsReceived: 0,
    }),
  );
  const onClose = vi.fn();
  const result = renderWithProviders(
    <RfqCreateDialog
      open
      nextId="RFQ-2026-006"
      initial={initial}
      onClose={onClose}
      onCreate={onCreate}
    />,
  );
  return { ...result, onCreate, onClose };
}

describe("RfqCreateDialog", { timeout: 20_000 }, () => {
  it("categoria → detalhes → revisão → envio", async () => {
    const { user, onCreate, onClose } = renderDialog();

    const next = await screen.findByRole("button", {
      name: /Proposals.rfq.create.next/,
    });
    expect(next).toBeDisabled();

    await user.click(
      screen.getByRole("radio", {
        name: /SellerOfferCreate.categories.physicalInfra.label/,
      }),
    );
    await user.click(next);

    // Sem os obrigatórios, não avança.
    await user.click(
      await screen.findByRole("button", {
        name: /Proposals.rfq.create.review/,
      }),
    );
    expect(
      await screen.findAllByText("Proposals.errors.required"),
    ).toHaveLength(3);

    await user.type(
      screen.getByLabelText(/Proposals.rfq.create.fields.product/),
      "Colocation 4U",
    );
    await user.type(
      screen.getByLabelText(/Proposals.rfq.create.fields.description \*/),
      "Rack 4U com energia N+1.",
    );
    await user.type(
      screen.getByLabelText(/Proposals.rfq.create.fields.location/),
      "São Paulo - SP",
    );
    await user.click(screen.getByText("Proposals.rfq.create.fields.urgent"));
    await user.click(
      screen.getByRole("button", { name: /Proposals.rfq.create.review/ }),
    );

    expect(
      await screen.findByText("Proposals.rfq.create.titles.review"),
    ).toBeVisible();
    expect(screen.getByText("RFQ-2026-006")).toBeVisible();
    expect(screen.getByText("Colocation 4U")).toBeVisible();
    expect(
      screen.getByText("Proposals.rfq.create.summary.urgent"),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: /Proposals.rfq.create.send/ }),
    );

    expect(
      await screen.findByText("Proposals.rfq.create.done.heading"),
    ).toBeVisible();
    expect(onCreate).toHaveBeenCalledWith({
      category: "physicalInfra",
      productName: "Colocation 4U",
      description: "Rack 4U com energia N+1.",
      location: "São Paulo - SP",
      budget: "",
      responseHours: 72,
      urgent: true,
      requirements: "",
    });

    await user.click(
      screen.getByRole("button", { name: "Proposals.rfq.create.finish" }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("refazer uma RFQ começa nos detalhes já preenchidos", async () => {
    renderDialog({
      category: "hardware",
      productName: "Roteadores Mikrotik RB4011 ×10",
      description: "Lote de 10 unidades.",
      location: "Russas - CE",
      budget: "",
      responseHours: 48,
      urgent: false,
      requirements: "",
    });

    expect(
      await screen.findByText("Proposals.rfq.create.titles.details"),
    ).toBeVisible();
    expect(
      screen.getByLabelText(/Proposals.rfq.create.fields.product/),
    ).toHaveValue("Roteadores Mikrotik RB4011 ×10");
    expect(
      screen.getByLabelText(/Proposals.rfq.create.fields.deadline/),
    ).toHaveValue("48");
  });
});
