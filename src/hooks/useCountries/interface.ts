export interface CountryOption {
  /** ISO 3166-1 alpha-2 (ex.: "BR"). */
  code: string;
  /** Nome localizado do país. */
  name: string;
}

export interface UseCountriesReturn {
  countries: CountryOption[];
  loading: boolean;
  error: boolean;
}
