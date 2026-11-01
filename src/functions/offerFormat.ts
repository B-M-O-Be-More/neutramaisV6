// Formatação dos valores do assistente de oferta para exibição (preview e
// revisão final). Valor vazio ou inválido devolve `undefined` — quem exibe
// decide o que mostrar no lugar.

import { parseDecimal } from "@/functions/parseDecimal";

/** "98,5" → "98,5%" no idioma da tela. */
export function formatPercent(
  value: string,
  locale: string,
): string | undefined {
  const number = parseDecimal(value);
  if (number === null) return undefined;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number)}%`;
}

/** "48" → "48h". */
export function formatHours(value: string): string | undefined {
  const hours = parseDecimal(value);
  return hours === null ? undefined : `${hours}h`;
}

/** "1.890,00" + "BRL" → "BRL 1.890,00" (código da moeda, como no design). */
export function formatMoney(
  value: string,
  currency: string,
  locale: string,
): string | undefined {
  const amount = parseDecimal(value);
  if (amount === null) return undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(amount);
}

/** "2026-12-31" → "31/12/2026" no idioma da tela, sem fuso. */
export function formatIsoDate(
  value: string,
  locale: string,
): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match.map(Number);
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
    new Date(year, month - 1, day),
  );
}
