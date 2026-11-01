import type { CheckoutSnapshot } from "@/services/checkoutSnapshot.service";

/**
 * loading: lendo o snapshot. ready: à venda. unavailable: saiu de venda (404).
 * ownOffer: oferta da própria organização (403, sem autocompra).
 * failed: outra falha — dá para tentar de novo.
 */
export type CartOfferingStatus =
  | "loading"
  | "ready"
  | "unavailable"
  | "ownOffer"
  | "failed";

export interface CartOffering {
  status: CartOfferingStatus;
  snapshot: CheckoutSnapshot | null;
}

export interface UseCartOfferingsReturn {
  /** Por offeringId; ausente = ainda não pedido. */
  offerings: Map<string, CartOffering>;
  /** Lê de novo as ofertas que falharam. */
  retry: () => void;
}
