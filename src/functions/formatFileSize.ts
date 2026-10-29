/** Tamanho em MB com uma casa ("2,4 MB"), no idioma da tela. */
export function formatFileSize(bytes: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024),
  )} MB`;
}
