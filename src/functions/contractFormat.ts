// Formatação dos contratos para exibição (lista, termos e detalhe).

import type { ContractAdjustment } from "@/types/contracts";

/** Mês abreviado, sem ponto e com inicial maiúscula: "mai." → "Mai". */
function shortMonth(date: Date, locale: string): string {
  const month = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
  return month.charAt(0).toUpperCase() + month.slice(1);
}

/** 99.5 → "99,5%" no idioma da tela. */
export function formatPercent(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)}%`;
}

/** ISO → "Jun/2026" (competência da fatura). Valor inválido sai como veio. */
export function formatBillingMonth(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${shortMonth(date, locale)}/${date.getUTCFullYear()}`;
}

/** { IPCA, 3.2, 2026-05 } → "IPCA +3,2% (mai/26)". */
export function formatAdjustment(
  adjustment: ContractAdjustment,
  locale: string,
): string {
  const date = new Date(adjustment.appliedAt);
  const rate = formatPercent(adjustment.rate, locale);
  if (Number.isNaN(date.getTime())) return `${adjustment.index} +${rate}`;
  const month = shortMonth(date, locale).toLowerCase();
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${adjustment.index} +${rate} (${month}/${year})`;
}
