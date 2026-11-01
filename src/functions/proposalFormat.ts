// Formatação das propostas e RFQs para exibição (cards e modais).

import type { Money } from "@/types/proposals";

/** { 1850, "BRL" } → "R$ 1.850,00" no idioma da tela. */
export function formatProposalMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount);
}

/**
 * Valor para o campo com máscara de dinheiro (sempre no formato brasileiro,
 * como a máscara): 1850 → "1.850,00".
 */
export function moneyInputValue(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "SpeedLine Telecom" → "SP" (selo do card). */
export function sellerInitials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
}

/** Horas inteiras até o prazo (arredondadas para cima); 0 se já passou. */
export function hoursUntil(iso: string, now: number): number {
  const diff = new Date(iso).getTime() - now;
  return Number.isFinite(diff) && diff > 0
    ? Math.ceil(diff / (60 * 60 * 1000))
    : 0;
}

/** ISO → "07/07/2026" no idioma da tela. Valor inválido sai como veio. */
export function formatShortDate(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(date);
}
