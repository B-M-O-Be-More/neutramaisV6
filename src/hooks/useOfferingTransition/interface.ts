import type { OfferingAction } from "@/services/productCatalog.service";

export type { OfferingAction };

export type OfferingTransitionResult =
  | { ok: true }
  | { ok: false; /** Chave de tradução do erro. */ errorKey: string };

export interface UseOfferingTransitionReturn {
  /** Oferta com transição em andamento; null quando nenhuma. */
  pendingId: string | null;
  transition: (
    offeringId: string,
    action: OfferingAction,
  ) => Promise<OfferingTransitionResult>;
}
