import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: DELETE /api/productCatalog/productOffering/{offeringId}/images/{imageId}
//   → marketplace-api DELETE /productCatalog/productOffering/{id}/images/{imageId}
// Remove a imagem da oferta (204).
export async function DELETE(
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
    method: "DELETE",
    path: `/productCatalog/productOffering/${offeringId}/images/${imageId}`,
    authenticated: true,
    profileSession: true,
  });
}
