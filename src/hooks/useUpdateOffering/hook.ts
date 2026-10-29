"use client";

import React from "react";

import { offerCategory } from "@/data/offerCategories";
import { buildOfferingUpdate } from "@/functions/buildOfferingPayload";
import { resolveOfferSpecification } from "@/functions/resolveOfferSpecification";
import type { SellerOfferValues } from "@/schemas/sellerOffer";
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  upstreamErrorCode,
} from "@/services/errors";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import type {
  UpdateOfferingOutcome,
  UseUpdateOfferingReturn,
} from "./interface";

function updateErrorKey(error: unknown): string {
  if (upstreamErrorCode(error) === "MKT_PERMISSION_REQUIRED") {
    return "SellerOffers.errors.permission";
  }
  if (error instanceof ForbiddenError)
    return "SellerOfferEdit.errors.forbidden";
  if (error instanceof ConflictError) return "SellerOfferEdit.errors.readOnly";
  if (error instanceof ApiError && error.status === 422) {
    return "SellerOfferCreate.publish.errors.invalid";
  }
  return "SellerOfferEdit.errors.saveFailed";
}

/**
 * Salva a edição de uma oferta (marketplace-api), sem mudar o status:
 * 1. plano da categoria (encontra ou cria, se a categoria mudou);
 * 2. `PATCH` com nome, preços, velocidade e `metadata`;
 * 3. vínculo do KMZ, quando a versão ou o recorte mudaram;
 * 4. patrocínio, quando mudou (falha vira aviso).
 */
export function useUpdateOffering(): UseUpdateOfferingReturn {
  const [isSaving, setIsSaving] = React.useState(false);

  const save = React.useCallback(
    async (
      offering: ProductOffering,
      values: SellerOfferValues,
    ): Promise<UpdateOfferingOutcome> => {
      const category = offerCategory(values.category);
      if (!category) {
        return {
          status: "failed",
          errorKey: "SellerOfferEdit.errors.saveFailed",
        };
      }

      setIsSaving(true);
      const warnings: string[] = [];
      try {
        try {
          const specificationId = await resolveOfferSpecification(
            category.specificationName,
          );
          await productCatalogService.updateOffering(
            offering.id,
            buildOfferingUpdate(values, specificationId, offering),
          );
        } catch (error) {
          return { status: "failed", errorKey: updateErrorKey(error) };
        }

        const coverageChanged =
          values.coverageVersionId !== (offering.coverageVersionId ?? "") ||
          values.coverageMode === "custom";
        if (
          category.requiresCoverage &&
          values.coverageVersionId &&
          coverageChanged
        ) {
          try {
            await productCatalogService.bindCoverage(
              offering.id,
              values.coverageVersionId,
              values.coverageMode === "custom" ? values.publicGeometry : null,
            );
          } catch (error) {
            return {
              status: "failed",
              errorKey:
                error instanceof ForbiddenError
                  ? "SellerOfferCreate.publish.errors.coveragePermission"
                  : "SellerOfferEdit.errors.coverageFailed",
            };
          }
        }

        if (values.sponsored !== !!offering.isPromoted) {
          try {
            await productCatalogService.setPromotion(
              offering.id,
              values.sponsored,
            );
          } catch (error) {
            warnings.push(
              error instanceof ForbiddenError
                ? "SellerOfferCreate.publish.warnings.promotionForbidden"
                : "SellerOfferCreate.publish.warnings.promotionFailed",
            );
          }
        }

        return { status: "saved", warnings };
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return { isSaving, save };
}
