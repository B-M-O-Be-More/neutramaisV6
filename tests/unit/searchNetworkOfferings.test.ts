import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import {
  detectServiceType,
  filterOfferings,
  toOfferCardProps,
} from "@/components/SearchNetworkCatalog/offerings";
import { DEFAULT_SEARCH_NETWORK_FILTERS } from "@/components/SearchNetworkFilters";
import type { ProductOffering } from "@/services/productCatalog.service";

function offering(overrides: Partial<ProductOffering> = {}): ProductOffering {
  return {
    id: "7f3c2b1a-9e8d-4c7b-a6f5-4e3d2c1b0a99",
    organizationId: "3f6d2a9e-1c4b-4e8a-9b7d-2a5c8e1f0b11",
    specificationId: "5b2e9c1d-3f4a-4b6c-8d7e-9f0a1b2c3d4e",
    name: "Fibra 500 Mega Empresarial",
    monthlyPrice: 1990,
    installationPrice: 0,
    speed: "500 Mbps",
    durationMonths: 12,
    isPublic: true,
    isCorporate: true,
    stateCode: "SP",
    isCapital: true,
    metadata: { ipFixo: true },
    isActive: true,
    createdAt: "2026-09-17T12:00:00+00:00",
    updatedAt: "2026-09-17T12:00:00+00:00",
    ...overrides,
  };
}

// t() de teste: devolve a chave com as variáveis, como o i18n sem recursos.
const t = ((key: string, vars?: Record<string, unknown>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key) as unknown as TFunction;

describe("detectServiceType", () => {
  it.each([
    ["Fibra 500 Mega Empresarial", "fiber"],
    ["Link Dedicado Fibra 200 Mbps", "dedicatedLink"],
    ["Trânsito IP 10G", "ipTransit"],
    ["VoIP Empresarial", "voip"],
    ["Bloco IPv4 /24", null],
  ])("%s → %s", (name, expected) => {
    expect(detectServiceType({ name })).toBe(expected);
  });
});

describe("filterOfferings", () => {
  const list = [
    offering({ id: "a", name: "Fibra 500 Mega", monthlyPrice: 1990 }),
    offering({
      id: "b",
      name: "Link Dedicado 100 Mbps",
      monthlyPrice: "2890.00",
      stateCode: "CE",
      metadata: { sla: 99.9 },
    }),
    offering({ id: "c", name: "Colocation 1U", monthlyPrice: 60000 }),
  ];
  const ids = (items: ProductOffering[]) => items.map((item) => item.id);

  it("sem filtros, mantém o que está na faixa de preço padrão", () => {
    expect(ids(filterOfferings(list, DEFAULT_SEARCH_NETWORK_FILTERS))).toEqual([
      "a",
      "b",
    ]);
  });

  it("combina a busca do banner com a do painel, sem acento", () => {
    const filters = { ...DEFAULT_SEARCH_NETWORK_FILTERS, search: "mbps" };
    expect(ids(filterOfferings(list, filters, "link"))).toEqual(["b"]);
  });

  it("filtra por tipo de serviço e UF", () => {
    expect(
      ids(
        filterOfferings(list, {
          ...DEFAULT_SEARCH_NETWORK_FILTERS,
          serviceTypes: ["fiber", "dedicatedLink"],
          stateCode: "CE",
        }),
      ),
    ).toEqual(["b"]);
  });

  it("SLA mínimo exclui ofertas sem SLA informado", () => {
    expect(
      ids(
        filterOfferings(list, {
          ...DEFAULT_SEARCH_NETWORK_FILTERS,
          minSla: "99.5",
        }),
      ),
    ).toEqual(["b"]);
  });

  it("aceita preço decimal serializado como string", () => {
    expect(
      ids(
        filterOfferings(list, {
          ...DEFAULT_SEARCH_NETWORK_FILTERS,
          priceRange: [2000, 3000],
        }),
      ),
    ).toEqual(["b"]);
  });
});

describe("toOfferCardProps", () => {
  it("monta o card a partir da oferta da API", () => {
    const props = toOfferCardProps(offering(), t, "pt-BR");

    expect(props.title).toBe("Fibra 500 Mega Empresarial");
    expect(props.headline).toEqual({ value: "500", unit: "Mbps" });
    expect(props.serviceType).toBe("SearchNetwork.filters.serviceTypes.fiber");
    expect(props.price.replace(/\s/g, " ")).toBe("R$ 1.990,00");
    expect(props.stats.map((stat) => stat.label)).toEqual([
      "SearchNetwork.catalog.card.installation",
      "SearchNetwork.catalog.card.contract",
    ]);
    expect(props.stats[0]).toMatchObject({
      value: "SearchNetwork.catalog.card.free",
      tone: "success",
    });
    expect(props.proposalHref).toBe(
      "/proposals/new?offeringId=7f3c2b1a-9e8d-4c7b-a6f5-4e3d2c1b0a99",
    );
    expect(props.seller).toBeUndefined();
  });

  it("mostra o SLA quando a especificação o informa", () => {
    const props = toOfferCardProps(
      offering({ metadata: { sla: 99.5 } }),
      t,
      "pt-BR",
    );
    expect(props.stats[1]).toMatchObject({
      label: "SearchNetwork.catalog.card.sla",
      value: "99,5%",
    });
  });
});
