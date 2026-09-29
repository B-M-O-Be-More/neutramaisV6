/** Tipos de serviço do filtro, na ordem do design (chaves de i18n). */
export const SERVICE_TYPE_KEYS = [
  "fiber",
  "dedicatedLink",
  "voip",
  "mpls",
  "colocation",
  "ipTransit",
] as const;

export type SearchNetworkServiceType = (typeof SERVICE_TYPE_KEYS)[number];

/** SLA mínimo aceito, em percentual. "any" desliga o filtro. */
export type SearchNetworkMinSla = "any" | "99" | "99.5" | "99.9";

export const SLA_OPTIONS: SearchNetworkMinSla[] = ["any", "99", "99.5", "99.9"];

/** Limites da faixa de preço mensal (R$). */
export const PRICE_MIN = 0;
export const PRICE_MAX = 50000;

export interface SearchNetworkFiltersValue {
  /** Texto livre — nome da oferta ou empresa. */
  search: string;
  /** Vazio = todos os tipos. */
  serviceTypes: SearchNetworkServiceType[];
  /** [mínimo, máximo] do preço mensal, em reais. */
  priceRange: [number, number];
  minSla: SearchNetworkMinSla;
  /** UF, duas letras. Vazio = todos os estados. */
  stateCode: string;
}

export const DEFAULT_SEARCH_NETWORK_FILTERS: SearchNetworkFiltersValue = {
  search: "",
  serviceTypes: [],
  priceRange: [PRICE_MIN, PRICE_MAX],
  minSla: "any",
  stateCode: "",
};

export interface SearchNetworkFiltersProps {
  value: SearchNetworkFiltersValue;
  onChange: (value: SearchNetworkFiltersValue) => void;
}
