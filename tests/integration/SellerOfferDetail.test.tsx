import { describe, expect, it, vi } from "vitest";

import SellerOfferDetail from "@/components/SellerOfferDetail";
import type { ProductOffering } from "@/services/productCatalog.service";

import { renderWithProviders, screen } from "../test-utils";

const OFFERING: ProductOffering = {
  id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
  organizationId: "org-1",
  specificationId: "spec-1",
  name: "Internet Fibra Premium 500 Mbps",
  monthlyPrice: "109.99",
  installationPrice: "0.00",
  speed: "500 Mbps",
  durationMonths: 12,
  isPublic: true,
  status: "published",
  isCorporate: false,
  stateCode: null,
  isCapital: false,
  coverageVersionId: null,
  isActive: true,
  isPromoted: true,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  metadata: {
    shortDescription: "Fibra óptica simétrica com IP fixo incluso.",
    description: "Link de fibra óptica premium com SLA de 99,5%.",
    technicalSlaPercent: 99.5,
    acceptanceSlaHours: 48,
    deliveryTime: "30 dias úteis",
    pricingModel: "monthly",
    currency: "BRL",
    cancellationTerms: "30 dias corridos, multa de 3 mensalidades.",
  },
};

function renderDetail(overrides: Partial<ProductOffering> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onTogglePromotion: vi.fn(),
  };
  const rendered = renderWithProviders(
    <SellerOfferDetail
      offering={{ ...OFFERING, ...overrides }}
      specificationName="Conectividade"
      locale="pt-BR"
      {...handlers}
    />,
  );
  return { ...rendered, ...handlers };
}

/** Valor da linha da tabela pelo rótulo (dt → dd). */
const rowValue = (label: string) =>
  screen.getByText(label).closest("div")?.querySelector("dd")?.textContent;

describe("SellerOfferDetail", () => {
  it("mostra status, categoria, especificações e preço da oferta", () => {
    renderDetail();

    expect(
      screen.getByRole("heading", { name: OFFERING.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerOffers.card.statuses.published"),
    ).toBeInTheDocument();
    expect(screen.getByText("SellerOffers.card.promoted")).toBeInTheDocument();
    expect(
      screen.getByText("SellerOfferCreate.categories.connectivity.label"),
    ).toBeInTheDocument();
    expect(screen.getByText(/OFR-0192A0B1/)).toBeInTheDocument();

    expect(rowValue("SellerOfferDetail.specs.speed")).toBe("500 Mbps");
    expect(rowValue("SellerOfferDetail.specs.technicalSla")).toBe("99,5%");
    expect(rowValue("SellerOfferDetail.specs.acceptanceSla")).toBe("48h");
    expect(rowValue("SellerOfferDetail.pricing.currency")).toBe("BRL");
    expect(rowValue("SellerOfferDetail.pricing.setup")).toBe("—");
    expect(rowValue("SellerOfferDetail.pricing.stock")).toBe(
      "SellerOfferDetail.pricing.stockOnRequest",
    );
    expect(rowValue("SellerOfferDetail.pricing.validUntil")).toBe(
      "SellerOfferDetail.pricing.noExpiry",
    );
  });

  it("sem KMZ, convida a editar para enviar a cobertura", async () => {
    const { user, onEdit } = renderDetail();

    expect(
      screen.getByText("SellerOfferDetail.coverage.emptyTitle"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "SellerOfferDetail.coverage.upload" }),
    );
    expect(onEdit).toHaveBeenCalled();
  });

  it("recolhe e mostra a descrição completa", async () => {
    const { user } = renderDetail();
    const toggle = screen.getByRole("button", {
      name: "SellerOfferDetail.description.hide",
    });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);

    expect(
      screen.queryByText(/premium com SLA de 99,5%/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "SellerOfferDetail.description.show",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("editar, patrocinar e voltar chamam as ações", async () => {
    const { user, onEdit, onTogglePromotion, onBack } = renderDetail({
      isPromoted: false,
    });

    await user.click(
      screen.getByRole("button", { name: "SellerOfferDetail.actions.edit" }),
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOfferDetail.actions.sponsor" }),
    );
    await user.click(
      screen.getByRole("button", { name: "SellerOfferDetail.actions.back" }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onTogglePromotion).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("arquivada é só leitura", () => {
    renderDetail({ status: "archived" });

    expect(
      screen.getByRole("button", { name: "SellerOfferDetail.actions.edit" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "SellerOfferDetail.actions.unsponsor",
      }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", {
        name: "SellerOfferDetail.coverage.upload",
      }),
    ).not.toBeInTheDocument();
  });
});
