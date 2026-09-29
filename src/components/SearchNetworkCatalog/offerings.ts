import type { TFunction } from "i18next";

import type {
  SearchNetworkFiltersValue,
  SearchNetworkServiceType,
} from "@/components/SearchNetworkFilters";
import type { SearchNetworkOfferCardProps } from "@/components/SearchNetworkOfferCard";
import type { ProductOffering } from "@/services/productCatalog.service";

// A marketplace-api ainda não expõe tipo de serviço, SLA nem provedor na
// oferta. Até expor, o tipo é inferido pelo nome e o SLA é lido de
// `metadata.sla` quando a especificação o define — quando os campos
// existirem, basta trocar `detectServiceType`/`readSla`.

// Ordem importa: o primeiro que casar vence ("Link Dedicado Fibra" é link).
const SERVICE_TYPE_KEYWORDS: [SearchNetworkServiceType, string[]][] = [
  ["mpls", ["mpls"]],
  ["voip", ["voip", "sip trunk", "telefonia"]],
  ["colocation", ["colocation"]],
  ["ipTransit", ["transito ip", "ip transit", "transito"]],
  ["dedicatedLink", ["link dedicado", "dedicado", "dedicated"]],
  ["fiber", ["fibra", "fiber", "ftth", "gpon"]],
];

/** Minúsculas e sem acentos — "Trânsito" casa com "transito". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function detectServiceType(
  offering: Pick<ProductOffering, "name">,
): SearchNetworkServiceType | null {
  const name = normalize(offering.name);
  const match = SERVICE_TYPE_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => name.includes(keyword)),
  );
  return match ? match[0] : null;
}

/** SLA em percentual (ex.: 99.5), quando a especificação o informa. */
export function readSla(
  offering: Pick<ProductOffering, "metadata">,
): number | null {
  const value = Number(offering.metadata?.sla);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Aplica os filtros à página carregada. `query` é o texto do banner e soma-se
 * ao campo "Buscar" do painel.
 *
 * SLA mínimo é estrito: oferta sem SLA informado não passa quando há mínimo.
 */
export function filterOfferings(
  offerings: ProductOffering[],
  filters: SearchNetworkFiltersValue,
  query = "",
): ProductOffering[] {
  const terms = [query, filters.search].map(normalize).filter(Boolean);
  const [minPrice, maxPrice] = filters.priceRange;
  const minSla = filters.minSla === "any" ? null : Number(filters.minSla);

  return offerings.filter((offering) => {
    if (terms.length) {
      const haystack = normalize(
        [offering.name, offering.speed, offering.stateCode]
          .filter(Boolean)
          .join(" "),
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (filters.serviceTypes.length) {
      const type = detectServiceType(offering);
      if (!type || !filters.serviceTypes.includes(type)) return false;
    }

    const price = Number(offering.monthlyPrice);
    if (price < minPrice || price > maxPrice) return false;

    if (minSla !== null) {
      const sla = readSla(offering);
      if (sla === null || sla < minSla) return false;
    }

    if (filters.stateCode && offering.stateCode !== filters.stateCode) {
      return false;
    }

    return true;
  });
}

/** "500 Mbps" → { value: "500", unit: "Mbps" }. */
function splitSpeed(speed: string): { value: string; unit?: string } {
  const match = speed.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { value: speed.trim() };
  return { value: match[1], unit: match[2] || undefined };
}

/**
 * Converte a oferta da API nas props do card. Provedor, selos e preço
 * anterior não vêm na API — esses blocos do card ficam ocultos.
 */
export function toOfferCardProps(
  offering: ProductOffering,
  t: TFunction,
  locale: string,
): SearchNetworkOfferCardProps {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  });
  const category = "connectivity";
  const categoryLabel = t(`Marketplace.categories.items.${category}.title`);
  const serviceType = detectServiceType(offering);
  const installation = Number(offering.installationPrice);
  const sla = readSla(offering);
  const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  const location = offering.stateCode
    ? offering.isCapital === null
      ? offering.stateCode
      : t(
          offering.isCapital
            ? "Marketplace.offers.capital"
            : "Marketplace.offers.countryside",
          { state: offering.stateCode },
        )
    : undefined;

  const stats: SearchNetworkOfferCardProps["stats"] = [
    {
      label: t("SearchNetwork.catalog.card.installation"),
      value:
        installation > 0
          ? money.format(installation)
          : t("SearchNetwork.catalog.card.free"),
      tone: installation > 0 ? "neutral" : "success",
    },
  ];
  if (sla !== null) {
    stats.push({
      label: t("SearchNetwork.catalog.card.sla"),
      value: `${percent.format(sla)}%`,
      tone: "success",
    });
  }
  if (offering.durationMonths) {
    stats.push({
      label: t("SearchNetwork.catalog.card.contract"),
      value: t("Marketplace.offers.months", { count: offering.durationMonths }),
      showClock: true,
    });
  }

  const query = `offeringId=${encodeURIComponent(offering.id)}`;

  return {
    category,
    serviceType: serviceType
      ? t(`SearchNetwork.filters.serviceTypes.${serviceType}`)
      : categoryLabel,
    location,
    title: offering.name,
    headline: offering.speed
      ? splitSpeed(offering.speed)
      : { value: categoryLabel },
    stats,
    price: money.format(Number(offering.monthlyPrice)),
    priceSuffix: t("Marketplace.offers.perMonth"),
    addHref: `/cart?${query}`,
    proposalHref: `/proposals/new?${query}`,
  };
}
