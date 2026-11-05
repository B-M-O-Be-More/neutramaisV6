import { beforeEach, describe, expect, it, vi } from "vitest";

import DirectProposalCreateDialog from "@/components/DirectProposalCreateDialog";
import type { SentDirectProposal } from "@/hooks/useSendDirectProposal";

import { renderWithProviders, screen, waitFor } from "../test-utils";

const OFFER = {
  id: "off-1",
  title: "Internet Fibra Premium",
  subtitle: "Russas/CE · R$ 109,99/mês",
  minPorts: 10,
  contractMonths: 12,
};

const SENT: SentDirectProposal = {
  id: "PROP-706542",
  version: 1,
  responseHours: 72,
  validityDays: 7,
};

// O Intl separa "R$" do número com espaço não separável.
const normalized = (text: string) => (content: string) =>
  content.replace(/\s/g, " ") === text;

const reviewButton = () =>
  screen.getByRole("button", { name: /SearchNetwork\.proposal\.review/ });

function renderDialog(onSend = vi.fn().mockResolvedValue(SENT)) {
  const onClose = vi.fn();
  const view = renderWithProviders(
    <DirectProposalCreateDialog
      offer={OFFER}
      buyerName="NetSpeed Telecom"
      defaultAddress={{
        street: "Rua Felipe Santiago",
        postalCode: "62420-000",
      }}
      locale="pt-BR"
      proposalsHref="/proposals"
      onClose={onClose}
      onSend={onSend}
    />,
  );
  return { ...view, onSend, onClose };
}

async function fillRequired(user: ReturnType<typeof renderDialog>["user"]) {
  await user.type(
    screen.getByLabelText("SearchNetwork.proposal.fields.number"),
    "520",
  );
  await user.type(
    screen.getByLabelText("SearchNetwork.proposal.fields.price"),
    "1200",
  );
  await user.type(
    screen.getByLabelText("SearchNetwork.proposal.fields.sla"),
    "99%",
  );
  await user.type(
    screen.getByLabelText("SearchNetwork.proposal.fields.delivery"),
    "20 dias",
  );
  await user.type(
    screen.getByLabelText("SearchNetwork.proposal.fields.cancellation"),
    "30 dias corridos",
  );
}

describe("DirectProposalCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pré-preenche endereço, portas e vigência e só libera a revisão com os obrigatórios", async () => {
    const { user } = renderDialog();

    expect(screen.getByText("Internet Fibra Premium")).toBeInTheDocument();
    expect(
      screen.getByLabelText("SearchNetwork.proposal.fields.street"),
    ).toHaveValue("Rua Felipe Santiago");
    expect(
      screen.getByLabelText("SearchNetwork.proposal.fields.postalCode"),
    ).toHaveValue("62420-000");
    expect(
      screen.getByRole("spinbutton", { name: /fields\.ports/ }),
    ).toHaveValue(10);
    expect(
      screen.getByRole("spinbutton", { name: /fields\.contractMonths/ }),
    ).toHaveValue(12);
    expect(reviewButton()).toBeDisabled();

    await fillRequired(user);

    await waitFor(() => expect(reviewButton()).toBeEnabled());
  });

  it("recusa menos portas que o mínimo da oferta", async () => {
    const { user } = renderDialog();
    const ports = screen.getByRole("spinbutton", { name: /fields\.ports/ });

    await user.clear(ports);
    await user.type(ports, "5");

    expect(
      await screen.findByText("SearchNetwork.proposal.errors.portsMin"),
    ).toBeInTheDocument();
    expect(reviewButton()).toBeDisabled();
  });

  it("revisa, volta para editar sem perder os dados e envia", async () => {
    const { user, onSend } = renderDialog();
    await fillRequired(user);
    await waitFor(() => expect(reviewButton()).toBeEnabled());
    await user.click(reviewButton());

    expect(
      await screen.findByText("SearchNetwork.proposal.titles.review"),
    ).toBeInTheDocument();
    expect(screen.getByText("NetSpeed Telecom")).toBeInTheDocument();
    expect(screen.getByText(normalized("R$ 12,00"))).toBeInTheDocument();
    expect(screen.getByText("99%")).toBeInTheDocument();
    expect(screen.getByText("20 dias")).toBeInTheDocument();
    expect(
      screen.getByText("SearchNetwork.proposal.summary.surveyNotRequired"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "SearchNetwork.proposal.edit" }),
    );
    expect(
      await screen.findByLabelText("SearchNetwork.proposal.fields.sla"),
    ).toHaveValue("99%");
    await waitFor(() => expect(reviewButton()).toBeEnabled());
    await user.click(reviewButton());

    await user.click(
      await screen.findByRole("button", {
        name: "SearchNetwork.proposal.confirm",
      }),
    );

    expect(onSend).toHaveBeenCalledWith(
      "off-1",
      expect.objectContaining({
        street: "Rua Felipe Santiago",
        number: "520",
        postalCode: "62420-000",
        ports: 10,
        contractMonths: 12,
        price: "12,00",
        sla: "99%",
        delivery: "20 dias",
        cancellation: "30 dias corridos",
        requiresSiteSurvey: false,
      }),
    );
    expect(await screen.findByText("PROP-706542")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "SearchNetwork.proposal.done.viewSent",
      }),
    ).toHaveAttribute("href", "/proposals");
  });

  it("falha no envio: continua na revisão", async () => {
    const { user } = renderDialog(vi.fn().mockRejectedValue(new Error("x")));
    await fillRequired(user);
    await waitFor(() => expect(reviewButton()).toBeEnabled());
    await user.click(reviewButton());
    await user.click(
      await screen.findByRole("button", {
        name: "SearchNetwork.proposal.confirm",
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "SearchNetwork.proposal.confirm" }),
      ).toBeEnabled(),
    );
    expect(screen.queryByText("PROP-706542")).not.toBeInTheDocument();
  });
});
