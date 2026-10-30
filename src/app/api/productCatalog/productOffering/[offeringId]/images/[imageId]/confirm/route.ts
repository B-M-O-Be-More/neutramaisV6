import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: POST /api/productCatalog/productOffering/{offeringId}/images/{imageId}/confirm
//   → marketplace-api POST /productCatalog/productOffering/{id}/images/{imageId}/confirm
// Confirma a imagem já enviada ao storage (idempotente). 409
// MKT_IMAGE_NOT_UPLOADED antes do envio; 422 quando o arquivo não confere.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ offeringId: string; imageId: string }> },
) {
  const { offeringId, imageId } = await params;
  if (!isUuid(offeringId) || !isUuid(imageId)) {
    return envelopeError(
      422,
      "validation_error",
      "offeringId e imageId devem ser UUIDs.",
    );
  }

  return forwardToMarketplace({
    method: "POST",
    path: `/productCatalog/productOffering/${offeringId}/images/${imageId}/confirm`,
    authenticated: true,
    profileSession: true,
  });
}
