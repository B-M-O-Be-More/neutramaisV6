import React from "react";
import { describe, expect, it, vi } from "vitest";

import SearchNetworkCatalog from "@/components/SearchNetworkCatalog";
import SearchNetworkHero from "@/components/SearchNetworkHero";
import SearchNetworkTabs from "@/components/SearchNetworkTabs";
import type { SearchNetworkTab } from "@/components/SearchNetworkTabs/interface";
import { productCatalogService } from "@/services/productCatalog.service";

import { renderWithProviders, screen } from "../test-utils";

const STATS = {
  verifiedSellers: "2.418",
  averageSla: "99,5%",
  categories: "4 MVP",
  nearbyNetworks: "3",
};

// A página controla o texto da busca; o wrapper reproduz esse estado.
function ControlledHero({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = React.useState("");
  return (
    <SearchNetworkHero
      detectedNetworks={3}
      stats={STATS}
      query={query}
      onQueryChange={setQuery}
      onSearch={onSearch}
    />
  );
}

describe("SearchNetworkHero", () => {
  it("envia a busca digitada, sem espaços nas pontas", async () => {
    const onSearch = vi.fn();
    const { user } = renderWithProviders(
      <ControlledHero onSearch={onSearch} />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "SearchNetwork.hero.searchLabel" }),
      "  Fortaleza ",
    );
    await user.click(
      screen.getByRole("button", { name: "SearchNetwork.hero.submit" }),
    );

    expect(onSearch).toHaveBeenCalledWith("Fortaleza");
  });

  it("preenche o campo e busca ao escolher um atalho", async () => {
    const onSearch = vi.fn();
    const { user } = renderWithProviders(
      <ControlledHero onSearch={onSearch} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "SearchNetwork.hero.quickFilters.colocation",
      }),
    );

    expect(onSearch).toHaveBeenCalledWith(
      "SearchNetwork.hero.quickFilters.colocation",
    );
    expect(
      screen.getByRole("textbox", { name: "SearchNetwork.hero.searchLabel" }),
    ).toHaveValue("SearchNetwork.hero.quickFilters.colocation");
  });
});

describe("SearchNetworkTabs", () => {
  it("marca a aba escolhida como selecionada", async () => {
    function ControlledTabs() {
      const [tab, setTab] = React.useState<SearchNetworkTab>("nearby");
      return <SearchNetworkTabs value={tab} onChange={setTab} />;
    }
    const { user } = renderWithProviders(<ControlledTabs />);

    const nearby = screen.getByRole("tab", {
      name: "SearchNetwork.tabs.nearby",
    });
    const available = screen.getByRole("tab", {
      name: "SearchNetwork.tabs.available",
    });
    expect(nearby).toHaveAttribute("aria-selected", "true");

    await user.click(available);

    expect(available).toHaveAttribute("aria-selected", "true");
    expect(nearby).toHaveAttribute("aria-selected", "false");
  });
});

describe("SearchNetworkCatalog", () => {
  const OFFERINGS = [
    {
      id: "a",
      organizationId: "org",
      specificationId: "spec",
      name: "Fibra 500 Mega",
      monthlyPrice: 1990,
      installationPrice: 0,
      speed: "500 Mbps",
      durationMonths: 12,
      isPublic: true,
      isCorporate: true,
      stateCode: "SP",
      isCapital: true,
      metadata: null,
      isActive: true,
      createdAt: "2026-09-17T12:00:00+00:00",
      updatedAt: "2026-09-17T12:00:00+00:00",
    },
    {
      id: "b",
      organizationId: "org",
      specificationId: "spec",
      name: "Link Dedicado 100 Mbps",
      monthlyPrice: 2890,
      installationPrice: 500,
      speed: "100 Mbps",
      durationMonths: 24,
      isPublic: true,
      isCorporate: true,
      stateCode: "CE",
      isCapital: false,
      metadata: null,
      isActive: true,
      createdAt: "2026-09-17T12:00:00+00:00",
      updatedAt: "2026-09-17T12:00:00+00:00",
    },
  ];

  it("lista as ofertas da API e filtra pelo painel", async () => {
    const spy = vi
      .spyOn(productCatalogService, "listOrganizationOfferings")
      .mockResolvedValue({
        message: "Offerings retrieved",
        data: OFFERINGS,
        metadata: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      });

    const { user } = renderWithProviders(
      <SearchNetworkCatalog tab="nearby" query="" onViewAll={vi.fn()} />,
    );

    expect(await screen.findByText("Fibra 500 Mega")).toBeInTheDocument();
    expect(screen.getByText("Link Dedicado 100 Mbps")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      { offset: 0, limit: 20 },
      expect.anything(),
    );

    await user.selectOptions(
      screen.getByLabelText("SearchNetwork.filters.state"),
      "CE",
    );
    expect(screen.queryByText("Fibra 500 Mega")).not.toBeInTheDocument();
    expect(screen.getByText("Link Dedicado 100 Mbps")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "SearchNetwork.filters.clear" }),
    );
    expect(screen.getByText("Fibra 500 Mega")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("oferece nova tentativa quando a API falha", async () => {
    const spy = vi
      .spyOn(productCatalogService, "listOrganizationOfferings")
      .mockRejectedValue(new Error("403"));

    renderWithProviders(
      <SearchNetworkCatalog tab="nearby" query="" onViewAll={vi.fn()} />,
    );

    expect(
      await screen.findByText("SearchNetwork.catalog.error"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SearchNetwork.catalog.retry" }),
    ).toBeInTheDocument();

    spy.mockRestore();
  });
});
