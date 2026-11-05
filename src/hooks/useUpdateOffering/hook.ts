"use client";

import React from "react";

import { offerCategory } from "@/data/offerCategories";
import { buildOfferingUpdate } from "@/functions/buildOfferingPayload";
import { resolveOfferSpecification } from "@/functions/resolveOfferSpecification";
import {
  EMPTY_OFFER_TEMPLATE,
  type OfferTemplate,
} from "@/functions/templateFields";
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
  const code = upstreamErrorCode(error);
  if (code === "MKT_PERMISSION_REQUIRED") {
    return "SellerOffers.errors.permission";
  }
  if (code?.startsWith("MKT_RULE_")) {
    return "SellerOfferCreate.publish.errors.ruleInvalid";
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
 * 1. especificação com os valores do template (edita a atual ou, se a
 *    categoria mudou, cria outra);
 * 2. `PATCH /productOffering/{id}` com nome, preços, velocidade e `metadata`;
 * 3. patrocínio, quando mudou (falha vira aviso).
 *
 * Fotos e cobertura têm botão próprio nas suas áreas
 * (`useOfferingImagesEditor`, `useOfferingCoverageEditor`).
 */
export function useUpdateOffering(): UseUpdateOfferingReturn {
  const [isSaving, setIsSaving] = React.useState(false);

  const save = React.useCallback(
    async (
      offering: ProductOffering,
      values: SellerOfferValues,
      initialValues?: SellerOfferValues,
      template: OfferTemplate = EMPTY_OFFER_TEMPLATE,
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
          // Mesma categoria (raiz ou subcategoria): a especificação atual
          // recebe os valores do template; categoria nova: especificação nova.
          const sameCategory =
            !!initialValues?.category &&
            values.category === initialValues.category &&
            values.categoryId === initialValues.categoryId;
          const specificationId = await resolveOfferSpecification(
            values,
            sameCategory ? offering : undefined,
            template.fields,
          );
          await productCatalogService.updateOffering(
            offering.id,
            buildOfferingUpdate(
              values,
              specificationId,
              offering,
              template.rules,
            ),
          );
        } catch (error) {
          return { status: "failed", errorKey: updateErrorKey(error) };
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
