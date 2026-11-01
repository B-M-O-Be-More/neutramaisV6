"use client";

import React from "react";

import { upstreamErrorCode } from "@/services/errors";
import { productCatalogService } from "@/services/productCatalog.service";

import type { OfferingAction, UseOfferingTransitionReturn } from "./interface";

// Códigos da marketplace-api → chave de tradução. Os gates de publicação
// (aprovação, KYC, cobertura) têm mensagem própria porque o seller precisa
// saber o que falta.
const ERROR_KEYS: Record<string, string> = {
  MKT_PERMISSION_REQUIRED: "SellerOffers.errors.permission",
  MKT_SELLER_NOT_APPROVED: "SellerOffers.errors.sellerNotApproved",
  MKT_KYC_NOT_VERIFIED: "SellerOffers.errors.kycNotVerified",
  MKT_OFFER_COVERAGE_REQUIRED: "SellerOffers.errors.coverageRequired",
  MKT_OFFER_SHIPPING_REQUIRED: "SellerOffers.errors.shippingRequired",
  MKT_OFFER_INVALID_TRANSITION: "SellerOffers.errors.invalidTransition",
  MKT_OFFER_ARCHIVED: "SellerOfferEdit.errors.readOnly",
};

/**
 * Transições do ciclo de vida da oferta (publicar, pausar, despublicar,
 * arquivar). Uma por vez: `pendingId` marca a oferta em andamento. Erros são
 * reduzidos a uma chave de tradução (SDD §12.4).
 */
export function useOfferingTransition(): UseOfferingTransitionReturn {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const transition = React.useCallback(
    async (offeringId: string, action: OfferingAction) => {
      setPendingId(offeringId);
      try {
        await productCatalogService.transitionOffering(offeringId, action);
        return { ok: true as const };
      } catch (error) {
        const code = upstreamErrorCode(error);
        return {
          ok: false as const,
          errorKey:
            (code && ERROR_KEYS[code]) ||
            "SellerOffers.errors.transitionFailed",
        };
      } finally {
        setPendingId(null);
      }
    },
    [],
  );

  return { pendingId, transition };
}
