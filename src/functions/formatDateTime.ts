/**
 * Data e hora ISO para exibição no idioma da interface (data e hora curtas).
 * Valor inválido sai como veio.
 */
export function formatDateTime(iso: string, language: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(language, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
