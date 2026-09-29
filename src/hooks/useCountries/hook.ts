"use client";

import React from "react";

import { COUNTRY_CODES } from "@/data/countries";

import { CountryOption, UseCountriesReturn } from "./interface";

/**
 * Monta a lista de países a partir dos códigos locais (src/data/countries.ts),
 * com o nome localizado via Intl.DisplayNames e ordenado pelo idioma atual.
 * Totalmente offline — sem requisições externas.
 */
export function useCountries(language: string): UseCountriesReturn {
  const countries = React.useMemo<CountryOption[]>(() => {
    let display: Intl.DisplayNames | undefined;
    try {
      display = new Intl.DisplayNames([language || "en"], { type: "region" });
    } catch {
      display = undefined;
    }

    return COUNTRY_CODES.map<CountryOption>((code) => ({
      code,
      name: display?.of(code) ?? code,
    })).sort((a, b) => a.name.localeCompare(b.name, language || undefined));
  }, [language]);

  return { countries, loading: false, error: false };
}
