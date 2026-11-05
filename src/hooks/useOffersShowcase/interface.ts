import type { OffersShowcase } from "@/types/offers";

export interface UseOffersShowcaseReturn {
  showcase: OffersShowcase;
  /** Momento da leitura, base do "Expira em…". */
  now: number;
}
