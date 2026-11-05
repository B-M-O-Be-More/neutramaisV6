import { normalize } from "@/components/SearchNetworkCatalog/offerings";
import type { ProductOffering } from "@/services/productCatalog.service";

/** Abas de "Produtos em alta" (Figma 2772-34211). */
export const TRENDING_FILTERS = [
  "all",
  "connectivity",
  "hardware",
  "numbering",
] as const;
export type TrendingFilter = (typeof TRENDING_FILTERS)[number];
export type TrendingCategory = Exclude<TrendingFilter, "all">;

// A API não traz a categoria da oferta: produto físico é hardware; blocos de
// IP e ASN são recursos de numeração; o resto é conectividade.
const NUMBERING_KEYWORDS = ["ipv4", "ipv6", "bloco ip", "asn", "numeracao"];

export function trendingCategory(
  offering: Pick<ProductOffering, "name" | "productType">,
): TrendingCategory {
  if (offering.productType === "physical") return "hardware";
  const name = normalize(offering.name);
  return NUMBERING_KEYWORDS.some((keyword) => name.includes(keyword))
    ? "numbering"
    : "connectivity";
}

/** Tempo até `expiresAt` em horas e minutos; null quando já venceu. */
export function timeLeft(
  expiresAt: string,
  now: number,
): { hours: number; minutes: number } | null {
  const minutes = Math.floor((new Date(expiresAt).getTime() - now) / 60_000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
