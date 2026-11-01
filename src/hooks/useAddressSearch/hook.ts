"use client";

import React from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { mapboxGeocodingService } from "@/services/mapboxGeocoding.service";

import type { GeocodingResult, UseAddressSearchReturn } from "./interface";

/** A busca só começa a partir de 3 letras. */
export const ADDRESS_SEARCH_MIN_LENGTH = 3;

// Referência estável: um `[]` novo a cada render faria quem reage à lista
// (ex.: o combobox, que copia os itens) renderizar em loop.
const NO_RESULTS: GeocodingResult[] = [];

/** Última resposta recebida, marcada com o texto que a originou. */
interface SearchResult {
  query: string;
  results: GeocodingResult[];
  hasError: boolean;
}

/**
 * Sugestões de endereço (Mapbox) para o texto digitado. Espera uma pausa na
 * digitação e cancela a busca anterior, para uma resposta atrasada não
 * sobrescrever a atual.
 */
export function useAddressSearch(query: string): UseAddressSearchReturn {
  const isUnavailable = !mapboxGeocodingService.isAvailable();
  const debounced = useDebouncedValue(query.trim(), 300);
  const enabled =
    !isUnavailable && debounced.length >= ADDRESS_SEARCH_MIN_LENGTH;
  const [result, setResult] = React.useState<SearchResult | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    mapboxGeocodingService
      .search(debounced, { signal: controller.signal })
      .then((results) =>
        setResult({ query: debounced, results, hasError: false }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ query: debounced, results: [], hasError: true });
        }
      });

    return () => controller.abort();
  }, [debounced, enabled]);

  const isCurrent = enabled && result?.query === debounced;
  // Também "carregando" durante a pausa da digitação.
  const isTyping = query.trim() !== debounced;

  return {
    results: isCurrent ? result.results : NO_RESULTS,
    isLoading:
      !isUnavailable &&
      query.trim().length >= ADDRESS_SEARCH_MIN_LENGTH &&
      (isTyping || !isCurrent),
    hasError: isCurrent && result.hasError,
    isUnavailable,
  };
}
