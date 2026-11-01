/** Área em km² ("12,4 km²"), com mais casas para áreas pequenas. */
export function formatArea(km2: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: km2 < 10 ? 2 : 1,
  }).format(km2)} km²`;
}
