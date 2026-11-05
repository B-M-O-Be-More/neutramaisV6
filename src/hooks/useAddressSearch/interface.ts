import type { GeocodingResult } from "@/services/mapboxGeocoding.service";

export type { GeocodingResult };

export interface UseAddressSearchReturn {
  results: GeocodingResult[];
  isLoading: boolean;
  /** A última busca falhou (rede, cota, token recusado). */
  hasError: boolean;
  /** Sem token do Mapbox: a busca nem é tentada. */
  isUnavailable: boolean;
}
