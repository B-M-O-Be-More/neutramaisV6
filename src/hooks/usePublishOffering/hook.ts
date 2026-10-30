"use client";

import React from "react";

import { offerCategory } from "@/data/offerCategories";
import { buildOfferingPayload } from "@/functions/buildOfferingPayload";
import { resolveOfferSpecification } from "@/functions/resolveOfferSpecification";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import { ApiError, ForbiddenError, upstreamErrorCode } from "@/services/errors";
import { productCatalogService } from "@/services/productCatalog.service";

import type {
  PublishOfferingOutcome,
  UsePublishOfferingReturn,
} from "./interface";

// Códigos da marketplace-api na publicação → mensagens já usadas em Minhas
// Ofertas (o seller vê o mesmo motivo nos dois lugares).
const PUBLISH_ERROR_KEYS: Record<string, string> = {
  MKT_PERMISSION_REQUIRED: "SellerOffers.errors.permission",
  MKT_SELLER_NOT_APPROVED: "SellerOffers.errors.sellerNotApproved",
  MKT_KYC_NOT_VERIFIED: "SellerOffers.errors.kycNotVerified",
  MKT_OFFER_COVERAGE_REQUIRED: "SellerOffers.errors.coverageRequired",
  MKT_OFFER_SHIPPING_REQUIRED: "SellerOffers.errors.shippingRequired",
  MKT_OFFER_INVALID_TRANSITION: "SellerOffers.errors.invalidTransition",
};

/** Progresso de uma oferta já criada — permite retomar sem duplicar. */
interface Progress {
  offeringId: string;
  promoted: boolean;
}

function createErrorKey(error: unknown): string {
  if (upstreamErrorCode(error) === "MKT_SELLER_NOT_APPROVED") {
    return "SellerOffers.errors.sellerNotApproved";
  }
  if (error instanceof ApiError && error.status === 422) {
    return "SellerOfferCreate.publish.errors.invalid";
  }
  return "SellerOfferCreate.publish.errors.createFailed";
}

/**
 * Criação da oferta no assistente (marketplace-api):
 * 1. plano da categoria (encontra ou cria);
 * 2. oferta como rascunho, com os dados extras em `metadata`;
 * 3. patrocínio, quando pedido (falha não impede a publicação);
 * 4. publicação — menos em Conectividade e Infra Física: sem cobertura a
 *    API recusa (`MKT_OFFER_COVERAGE_REQUIRED`), e ela só é vinculada à
 *    oferta já criada. Essas ficam como rascunho (`needsCoverage`) e seguem
 *    para a área de cobertura da edição.
 *
 * Fotos e cobertura não entram aqui: têm áreas próprias na edição.
 *
 * Se a oferta já foi criada e um passo seguinte falhou, a próxima chamada
 * retoma dali — sem criar outra oferta.
 */
export function usePublishOffering(): UsePublishOfferingReturn {
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [progress, setProgress] = React.useState<Progress | null>(null);
  // Cópia síncrona para as etapas lerem o progresso atualizado.
  const progressRef = React.useRef<Progress | null>(null);

  const saveProgress = (next: Progress) => {
    progressRef.current = next;
    setProgress(next);
  };

  const publish = React.useCallback(
    async (values: SellerOfferValues): Promise<PublishOfferingOutcome> => {
      const category = offerCategory(values.category);
      if (!category) {
        return {
          status: "failed",
          errorKey: "SellerOfferCreate.publish.errors.createFailed",
        };
      }

      setIsPublishing(true);
      const warnings: string[] = [];
      try {
        // 1–2. Plano e oferta (só na primeira tentativa).
        if (!progressRef.current) {
          try {
            const specificationId = await resolveOfferSpecification(
              category.specificationName,
            );
            const offering = await productCatalogService.createOffering(
              buildOfferingPayload(values, specificationId),
            );
            saveProgress({ offeringId: offering!.id, promoted: false });
          } catch (error) {
            return { status: "failed", errorKey: createErrorKey(error) };
          }
        }

        const current = progressRef.current!;
        const draft = (reasonKey: string): PublishOfferingOutcome => ({
          status: "draft",
          offeringId: current.offeringId,
          reasonKey,
          warnings,
        });

        // 3. Patrocínio — sem permissão, publica mesmo assim e avisa.
        if (values.sponsored && !progressRef.current!.promoted) {
          try {
            await productCatalogService.setPromotion(current.offeringId, true);
            saveProgress({ ...progressRef.current!, promoted: true });
          } catch (error) {
            warnings.push(
              error instanceof ForbiddenError
                ? "SellerOfferCreate.publish.warnings.promotionForbidden"
                : "SellerOfferCreate.publish.warnings.promotionFailed",
            );
          }
        }

        // 4. Publicação — sem cobertura ainda, fica como rascunho.
        if (category.requiresCoverage) {
          return {
            status: "needsCoverage",
            offeringId: current.offeringId,
            warnings,
          };
        }
        try {
          await productCatalogService.transitionOffering(
            current.offeringId,
            "publish",
          );
        } catch (error) {
          const code = upstreamErrorCode(error);
          return draft(
            (code && PUBLISH_ERROR_KEYS[code]) ||
              "SellerOfferCreate.publish.errors.publishFailed",
          );
        }

        return {
          status: "published",
          offeringId: current.offeringId,
          warnings,
        };
      } finally {
        setIsPublishing(false);
      }
    },
    [],
  );

  return {
    isPublishing,
    createdOfferingId: progress?.offeringId ?? null,
    publish,
  };
}
