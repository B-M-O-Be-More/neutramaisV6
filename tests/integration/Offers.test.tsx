import { afterEach, describe, expect, it, vi } from "vitest";

import OfferCampaignCard from "@/components/OfferCampaignCard";
import OffersHero from "@/components/OffersHero";
import TrendingProducts from "@/components/TrendingProducts";
import type { TrendingFilter } from "@/functions/offers";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";
import type { CampaignOffer } from "@/types/offers";

import { renderWithProviders, screen, within } from "../test-utils";

function offering(overrides: Partial<ProductOffering>): ProductOffering {
  return {
    id: "o",
    organizationId: "org",
    specificationId: "spec",
    name: "Oferta",
    monthlyPrice: 100,
    installationPrice: 0,
    speed: null,
    durationMonths: 12,
    isPublic: true,
    isCorporate: true,
    stateCode: "CE",
    isCapital: false,
    metadata: null,
    isActive: true,
    createdAt: "2026-09-17T12:00:00+00:00",
    updatedAt: "2026-09-17T12:00:00+00:00",
    ...overrides,
  };
}

const OFFERINGS = [
  offering({
    id: "fiber",
    name: "Fibra Premium 500 Mbps",
    monthlyPrice: 109.99,
  }),
  offering({
    id: "router",
    name: "Roteador Mikrotik RB4011",
    monthlyPrice: 990,
    productType: "physical",
  }),
  offering({
    id: "ipv4",
    name: "Bloco IPv4 /24",
    monthlyPrice: 4420.04,
    isPromoted: true,
  }),
];

// O Intl separa "R$" do número com espaço não separável.
const normalized = (text: string) => (content: string) =>
  content.replace(/\s/g, " ") === text;

function renderTrending(filter: TrendingFilter = "all") {
  const onFilterChange = vi.fn();
  const view = renderWithProviders(
    <TrendingProducts
      filter={filter}
      onFilterChange={onFilterChange}
      locale="pt-BR"
    />,
  );
  return { ...view, onFilterChange };
}

describe("TrendingProducts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista as ofertas públicas com a patrocinada primeiro", async () => {
    const spy = vi
      .spyOn(productCatalogService, "searchOfferings")
      .mockResolvedValue({ message: "ok", data: OFFERINGS, metadata: null });

    renderTrending();

    const cards = await screen.findAllByRole("article");
    expect(spy).toHaveBeenCalledWith({ pageSize: 20 }, expect.anything());
    expect(
      cards.map((card) => within(card).getByRole("heading").textContent),
    ).toEqual([
      "Bloco IPv4 /24",
      "Fibra Premium 500 Mbps",
      "Roteador Mikrotik RB4011",
    ]);
    expect(within(cards[0]).getByText("Offers.sponsored")).toBeInTheDocument();
    expect(
      within(cards[1]).getByText("Offers.trending.hot"),
    ).toBeInTheDocument();
    // Serviço tem "/mês"; produto físico, não.
    expect(
      within(cards[1]).getByText(normalized("R$ 109,99")),
    ).toBeInTheDocument();
    expect(
      within(cards[1]).getByText("Marketplace.offers.perMonth"),
    ).toBeInTheDocument();
    expect(
      within(cards[2]).queryByText("Marketplace.offers.perMonth"),
    ).not.toBeInTheDocument();
    expect(
      within(cards[2]).getByRole("link", { name: "Offers.trending.add" }),
    ).toHaveAttribute("href", "/cart?offeringId=router");
  });

  it("filtra pela categoria mantendo a posição no ranking", async () => {
    vi.spyOn(productCatalogService, "searchOfferings").mockResolvedValue({
      message: "ok",
      data: OFFERINGS,
      metadata: null,
    });

    const { user, onFilterChange } = renderTrending("hardware");

    const [card] = await screen.findAllByRole("article");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(within(card).getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Offers.trending.filters.hardware" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: "Offers.trending.filters.numbering" }),
    );
    expect(onFilterChange).toHaveBeenCalledWith("numbering");
  });

  it("oferece nova tentativa quando a busca falha", async () => {
    vi.spyOn(productCatalogService, "searchOfferings").mockRejectedValue(
      new Error("500"),
    );

    renderTrending();

    expect(
      await screen.findByText("Offers.trending.error"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Offers.trending.retry" }),
    ).toBeInTheDocument();
  });
});

describe("OffersHero", () => {
  it("cada atalho abre a categoria correspondente", async () => {
    const onSelectCategory = vi.fn();
    const { user } = renderWithProviders(
      <OffersHero onSelectCategory={onSelectCategory} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Offers.hero.shortcuts.ip" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Offers.hero.shortcuts.hardware" }),
    );

    expect(onSelectCategory.mock.calls).toEqual([["numbering"], ["hardware"]]);
  });
});

describe("OfferCampaignCard", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");
  const OFFER: CampaignOffer = {
    id: "c1",
    badge: "bestOffers",
    cover: "hardware",
    sponsored: true,
    discountPercent: 23,
    provider: {
      name: "Russas Telecom",
      rating: 4.8,
      reviews: 124,
      kycVerified: true,
    },
    category: "hardware",
    location: "Nacional",
    title: "Roteador Mikrotik RB4011",
    expiresAt: "2026-11-01T15:37:00Z",
  };

  it("mostra selos, provedor, prazo e leva ao catálogo", () => {
    renderWithProviders(
      <OfferCampaignCard offer={OFFER} now={now} href="/search-network" />,
    );

    expect(screen.getByText("Offers.badges.bestOffers")).toBeInTheDocument();
    expect(screen.getByText("Offers.sponsored")).toBeInTheDocument();
    expect(screen.getByText("Offers.discount")).toBeInTheDocument();
    expect(screen.getByText("Russas Telecom")).toBeInTheDocument();
    expect(screen.getByText("Offers.provider.kyc")).toBeInTheDocument();
    expect(screen.getByText("Nacional")).toBeInTheDocument();
    expect(screen.getByText("Offers.expiresIn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Offers.view" })).toHaveAttribute(
      "href",
      "/search-network",
    );
  });

  it("esconde o prazo quando a promoção já venceu", () => {
    renderWithProviders(
      <OfferCampaignCard
        offer={{ ...OFFER, expiresAt: "2026-11-01T11:00:00Z" }}
        now={now}
        href="/search-network"
      />,
    );

    expect(screen.queryByText("Offers.expiresIn")).not.toBeInTheDocument();
  });
});
