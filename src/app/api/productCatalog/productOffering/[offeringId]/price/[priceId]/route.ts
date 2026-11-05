import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace, pickBody } from "@/server/marketplaceProxy";

// Campos de `PATCH /price/{id}`: `priceType` e `recurringPeriod` não mudam.
const UPDATE_FIELDS = [
  "currency",
  "amount",
  "minQuantity",
  "maxQuantity",
] as const;

type Params = { params: Promise<{ offeringId: string; priceId: string }> };

async function ids({ params }: Params) {
  const { offeringId, priceId } = await params;
  return isUuid(offeringId) && isUuid(priceId) ? { offeringId, priceId } : null;
}

const invalidIds = () =>
  envelopeError(
    422,
    "validation_error",
    "offeringId e priceId devem ser UUIDs.",
  );

// BFF: PATCH /api/productCatalog/productOffering/{offeringId}/price/{priceId}
//   → marketplace-api PATCH /productCatalog/productOffering/{id}/price/{priceId}
// Altera um preço ativo: a API encerra o atual e cria outro, com ID novo (o
// histórico fica). Exige `price:change`.
export async function PATCH(request: NextRequest, context: Params) {
  const found = await ids(context);
  if (!found) return invalidIds();

  return forwardToMarketplace({
    method: "PATCH",
    path: `/productCatalog/productOffering/${found.offeringId}/price/${found.priceId}`,
    body: pickBody(await readJsonBody(request), UPDATE_FIELDS),
    authenticated: true,
    profileSession: true,
  });
}

// BFF: DELETE /api/productCatalog/productOffering/{offeringId}/price/{priceId}
//   → marketplace-api DELETE /productCatalog/productOffering/{id}/price/{priceId}
// Encerra um preço ativo (fica no histórico com `validTo`). 409
// `MKT_OFFER_PRICE_REQUIRED` quando a oferta publicada ficaria sem preço.
export async function DELETE(_request: NextRequest, context: Params) {
  const found = await ids(context);
  if (!found) return invalidIds();

  return forwardToMarketplace({
    method: "DELETE",
    path: `/productCatalog/productOffering/${found.offeringId}/price/${found.priceId}`,
    authenticated: true,
    profileSession: true,
  });
}
