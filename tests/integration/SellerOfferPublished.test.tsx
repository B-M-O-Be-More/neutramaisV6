import { describe, expect, it } from "vitest";

import SellerOfferPublished from "@/components/SellerOfferPublished";

import { renderWithProviders, screen, within } from "../test-utils";

const OFFER = {
  offeringId: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
  name: "Link Dedicado 1 Gbps",
  categoryLabel: "Software",
  price: "BRL 1.890,00",
  acceptanceSla: "48h",
  needsCoverage: false,
  warnings: [],
};

describe("SellerOfferPublished", () => {
  it("confirma a publicação com o resumo da oferta", () => {
    renderWithProviders(<SellerOfferPublished offer={OFFER} />);

    const section = screen.getByRole("region", {
      name: "SellerOfferCreate.published.title",
    });
    expect(within(section).getByText("Link Dedicado 1 Gbps")).toBeVisible();
    expect(within(section).getByText("Software")).toBeVisible();
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

  it("leva para as fotos da oferta, que só entram depois de criada", () => {
    renderWithProviders(<SellerOfferPublished offer={OFFER} />);

    expect(
      screen.getByRole("link", {
        name: /SellerOfferCreate.published.addPhotos/,
      }),
    ).toHaveAttribute(
      "href",
      `/seller/offers/${OFFER.offeringId}/edit?section=photos`,
    );
  });

  it("sem cobertura: avisa que ficou rascunho e leva à área de cobertura", () => {
    renderWithProviders(
      <SellerOfferPublished
        offer={{
          ...OFFER,
          categoryLabel: "Conectividade",
          needsCoverage: true,
        }}
      />,
    );

    const section = screen.getByRole("region", {
      name: "SellerOfferCreate.created.title",
    });
    expect(
      within(section).getByText("SellerOfferCreate.created.statusValue"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /SellerOfferCreate.created.addCoverage/,
      }),
    ).toHaveAttribute(
      "href",
      `/seller/offers/${OFFER.offeringId}/edit?section=coverage`,
    );
    // As fotos continuam à mão.
    expect(
      screen.getByRole("link", {
        name: /SellerOfferCreate.published.addPhotos/,
      }),
    ).toBeVisible();
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
