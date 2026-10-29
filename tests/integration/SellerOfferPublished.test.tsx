import { describe, expect, it } from "vitest";

import SellerOfferPublished from "@/components/SellerOfferPublished";

import { renderWithProviders, screen, within } from "../test-utils";

const OFFER = {
  offeringId: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
  name: "Link Dedicado 1 Gbps",
  categoryLabel: "Conectividade",
  price: "BRL 1.890,00",
  acceptanceSla: "48h",
  warnings: [],
};

describe("SellerOfferPublished", () => {
  it("confirma a publicação com o resumo da oferta", () => {
    renderWithProviders(<SellerOfferPublished offer={OFFER} />);

    const section = screen.getByRole("region", {
      name: "SellerOfferCreate.published.title",
    });
    expect(within(section).getByText("Link Dedicado 1 Gbps")).toBeVisible();
    expect(within(section).getByText("Conectividade")).toBeVisible();
    expect(within(section).getByText("BRL 1.890,00")).toBeVisible();
    expect(within(section).getByText("48h")).toBeVisible();
    expect(
      within(section).getByText("SellerOfferCreate.published.statusValue"),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("leva de volta para Minhas Ofertas", () => {
    renderWithProviders(<SellerOfferPublished offer={OFFER} />);

    expect(
      screen.getByRole("link", {
        name: /SellerOfferCreate.published.backToOffers/,
      }),
    ).toHaveAttribute("href", "/seller/offers");
  });

  it("mostra os avisos da publicação", () => {
    renderWithProviders(
      <SellerOfferPublished
        offer={{ ...OFFER, warnings: ["Patrocínio não aplicado."] }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Patrocínio não aplicado.",
    );
  });
});
