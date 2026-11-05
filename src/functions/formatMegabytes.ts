/**
 * Valor em MB decimal (1 MB = 1.000.000 bytes, como a geo-api conta a cota)
 * com até duas casas ("120,5 MB"), no idioma da tela.
 */
export function formatMegabytes(megabytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    megabytes,
  )} MB`;
}
