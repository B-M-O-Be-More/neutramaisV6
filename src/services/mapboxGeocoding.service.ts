// Busca de endereços (Mapbox Geocoding API v6, forward).
// Diferente dos outros services, fala direto com o Mapbox, sem o BFF: o token
// é público (NEXT_PUBLIC_MAPBOX_TOKEN, o mesmo do mapa) e restrito às URLs da
// aplicação no painel do Mapbox. Sem tratamento de erro aqui — o hook decide.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ENDPOINT = "https://api.mapbox.com/search/geocode/v6/forward";

// Tipos úteis para uma localidade de atendimento (sem país/região inteiros).
const TYPES = "address,street,neighborhood,locality,place,postcode";

/** Endereço sugerido, já com o rótulo de exibição. */
export interface GeocodingResult {
  id: string;
  /** Endereço completo (ex.: "Av. Dom Luís, 300, Fortaleza - CE, 60160-230"). */
  label: string;
  longitude: number;
  latitude: number;
}

interface MapboxFeature {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    full_address?: string;
    name?: string;
    place_formatted?: string;
    coordinates?: { longitude?: number; latitude?: number };
  };
}

export class GeocodingUnavailableError extends Error {
  constructor() {
    super("NEXT_PUBLIC_MAPBOX_TOKEN não configurado.");
    this.name = "GeocodingUnavailableError";
  }
}

function toResult(feature: MapboxFeature): GeocodingResult | null {
  const props = feature.properties ?? {};
  const longitude =
    props.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const latitude =
    props.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const label =
    props.full_address ??
    [props.name, props.place_formatted].filter(Boolean).join(", ");
  const id = props.mapbox_id ?? feature.id;

  if (
    !id ||
    !label ||
    typeof longitude !== "number" ||
    typeof latitude !== "number"
  ) {
    return null;
  }
  return { id, label, longitude, latitude };
}

export const mapboxGeocodingService = {
  /** True quando há token para buscar endereços. */
  isAvailable: () => !!MAPBOX_TOKEN,

  /**
   * Endereços que correspondem ao texto, no Brasil, em português, para
   * autocompletar. Lança `GeocodingUnavailableError` sem token.
   */
  search: async (
    query: string,
    options: { signal?: AbortSignal; limit?: number } = {},
  ): Promise<GeocodingResult[]> => {
    if (!MAPBOX_TOKEN) throw new GeocodingUnavailableError();

    const params = new URLSearchParams({
      q: query,
      access_token: MAPBOX_TOKEN,
      autocomplete: "true",
      country: "br",
      language: "pt",
      limit: String(options.limit ?? 5),
      types: TYPES,
    });
    const response = await fetch(`${ENDPOINT}?${params}`, {
      signal: options.signal,
    });
    if (!response.ok) {
      throw new Error(`Mapbox Geocoding respondeu ${response.status}.`);
    }
    const body = (await response.json()) as { features?: MapboxFeature[] };
    return (body.features ?? [])
      .map(toResult)
      .filter((result): result is GeocodingResult => result !== null);
  },
};
