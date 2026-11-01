import { NextRequest } from "next/server";

import { isUuid, readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// Teto do contrato da marketplace-api para `imageIds`.
const MAX_IDS = 50;

// BFF: PUT /api/productCatalog/productOffering/{offeringId}/images/order
//   → marketplace-api PUT /productCatalog/productOffering/{id}/images/order
// Nova ordem das imagens: todas as confirmadas, a capa primeiro.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  const imageIds = (
    (await readJsonBody(request)) as { imageIds?: unknown } | undefined
  )?.imageIds;

  if (
    !isUuid(offeringId) ||
    !Array.isArray(imageIds) ||
    imageIds.length < 1 ||
    imageIds.length > MAX_IDS ||
    !imageIds.every((id) => typeof id === "string" && isUuid(id))
  ) {
    return envelopeError(
      422,
      "validation_error",
      "offeringId e imageIds devem ser UUIDs (de 1 a 50 imagens).",
    );
  }

  return forwardToMarketplace({
    method: "PUT",
    path: `/productCatalog/productOffering/${offeringId}/images/order`,
    body: { imageIds },
    authenticated: true,
    profileSession: true,
  });
}
