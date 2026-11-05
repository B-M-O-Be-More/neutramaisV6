import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerOfferPrices from "@/components/SellerOfferPrices";
import { ValidationError } from "@/services/errors";
import {
  offeringPricesService,
  type OfferingPrice,
} from "@/services/offeringPrices.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/offeringPrices.service", async (original) => ({
  ...(await original<typeof import("@/services/offeringPrices.service")>()),
  offeringPricesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    end: vi.fn(),
  },
}));

const OFFERING_ID = "33333333-3333-4333-8333-333333333333";

const price = (overrides: Partial<OfferingPrice> = {}): OfferingPrice => ({
  id: "p-1",
  priceType: "recurring",
  currency: "BRL",
  amount: "219.90",
  recurringPeriod: "month",
  minQuantity: 1,
  maxQuantity: 4,
  validFrom: "2026-10-31T09:12:40Z",
  validTo: null,
  ...overrides,
});

const ACTIVE = [
  price(),
  price({ id: "p-2", amount: "189.90", minQuantity: 5, maxQuantity: null }),
];

function renderPrices(canEdit = true, onChanged = vi.fn()) {
  renderWithProviders(
    <SellerOfferPrices
      offeringId={OFFERING_ID}
      currency="BRL"
      locale="pt-BR"
      canEdit={canEdit}
      onChanged={onChanged}
    />,
  );
  return onChanged;
}

describe("SellerOfferPrices (preços da oferta)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offeringPricesService.list).mockResolvedValue(ACTIVE);
    vi.mocked(offeringPricesService.create).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(offeringPricesService.update).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(offeringPricesService.end).mockResolvedValue(undefined as never);
  });

  it("lista os preços ativos com tipo, faixa e valor", async () => {
    renderPrices();

    const rows = await screen.findAllByRole("row");
    // Cabeçalho + 2 preços.
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("SellerOfferPrices.types.recurring"));
    expect(within(rows[1]).getByText("SellerOfferPrices.range"));
    expect(within(rows[1]).getByText(/219,90/)).toBeInTheDocument();
    expect(within(rows[2]).getByText("SellerOfferPrices.rangeOpen"));
    expect(offeringPricesService.list).toHaveBeenCalledWith(OFFERING_ID, {
      history: false,
      signal: expect.anything(),
    });
  });

  it("o histórico relê com os preços encerrados", async () => {
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
      />,
    );
    await screen.findAllByRole("row");

    await user.click(screen.getByText("SellerOfferPrices.showHistory"));

    await waitFor(() =>
      expect(offeringPricesService.list).toHaveBeenLastCalledWith(OFFERING_ID, {
        history: true,
        signal: expect.anything(),
      }),
    );
  });

  it("adiciona uma faixa mensal com a moeda da oferta e avisa a página", async () => {
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
        onChanged={vi.fn()}
      />,
    );
    await screen.findAllByRole("row");

    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.amount"),
      "15990",
    );
    await user.clear(
      screen.getByLabelText("SellerOfferPrices.add.minQuantity"),
    );
    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.minQuantity"),
      "21",
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOfferPrices.add.submit" }),
    );

    expect(offeringPricesService.create).toHaveBeenCalledWith(OFFERING_ID, {
      priceType: "recurring",
      currency: "BRL",
      amount: "159.90",
      recurringPeriod: "month",
      minQuantity: 21,
      maxQuantity: null,
    });
    // A lista é relida.
    await waitFor(() =>
      expect(offeringPricesService.list).toHaveBeenCalledTimes(2),
    );
  });

  it("fim da faixa menor que o início trava o envio", async () => {
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
      />,
    );
    await screen.findAllByRole("row");

    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.amount"),
      "1000",
    );
    await user.clear(
      screen.getByLabelText("SellerOfferPrices.add.minQuantity"),
    );
    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.minQuantity"),
      "10",
    );
    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.maxQuantity"),
      "5",
    );

    expect(
      screen.getByRole("button", { name: "SellerOfferPrices.add.submit" }),
    ).toBeDisabled();
  });

  it("faixa sobreposta (422) explica o que ajustar", async () => {
    vi.mocked(offeringPricesService.create).mockRejectedValue(
      new ValidationError(422, [
        { field: "", code: "MKT_PRICE_TIER_OVERLAP", detail: "" },
      ]),
    );
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
      />,
    );
    await screen.findAllByRole("row");

    await user.type(
      screen.getByLabelText("SellerOfferPrices.add.amount"),
      "1000",
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOfferPrices.add.submit" }),
    );

    expect(
      await screen.findByText("SellerOfferPrices.errors.overlap"),
    ).toBeInTheDocument();
  });

  it("altera o valor de um preço ativo", async () => {
    const onChanged = vi.fn();
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
        onChanged={onChanged}
      />,
    );
    const rows = await screen.findAllByRole("row");

    await user.click(
      within(rows[1]).getByRole("button", { name: "SellerOfferPrices.edit" }),
    );
    const input = screen.getByLabelText("SellerOfferPrices.newAmount");
    expect(input).toHaveValue("219,90");
    await user.clear(input);
    await user.type(input, "20990");
    await user.click(
      screen.getByRole("button", { name: "SellerOfferPrices.save" }),
    );

    expect(offeringPricesService.update).toHaveBeenCalledWith(
      OFFERING_ID,
      "p-1",
      { amount: "209.90" },
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("encerra um preço depois de confirmar", async () => {
    const { user } = renderWithProviders(
      <SellerOfferPrices
        offeringId={OFFERING_ID}
        currency="BRL"
        locale="pt-BR"
        canEdit
      />,
    );
    const rows = await screen.findAllByRole("row");

    await user.click(
      within(rows[2]).getByRole("button", { name: "SellerOfferPrices.end" }),
    );
    expect(offeringPricesService.end).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "SellerOfferPrices.confirmEnd" }),
    );

    expect(offeringPricesService.end).toHaveBeenCalledWith(OFFERING_ID, "p-2");
  });

  it("sem price:change, só lista", async () => {
    renderPrices(false);

    await screen.findAllByRole("row");
    expect(
      screen.queryByRole("button", { name: "SellerOfferPrices.edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("SellerOfferPrices.add.title"),
    ).not.toBeInTheDocument();
  });
});
