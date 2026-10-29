import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";
import { forwardToMarketplace } from "@/server/marketplaceProxy";

// BFF: PUT /api/productCatalog/productOffering/{offeringId}/promotion
//   → marketplace-api PUT /productCatalog/productOffering/{id}/promotion
// Liga/desliga o patrocínio. Exige `offer:promote`; o upstream recusa campos
// extras, então só `isPromoted` é repassado.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;
  const body = (await readJsonBody(request)) as
    | { isPromoted?: unknown }
    | undefined;

  if (typeof body?.isPromoted !== "boolean") {
    return envelopeError(
      422,
      "validation_error",
      "isPromoted deve ser booleano.",
    );
  }

  return forwardToMarketplace({
    method: "PUT",
    path: `/productCatalog/productOffering/${encodeURIComponent(offeringId)}/promotion`,
    body: { isPromoted: body.isPromoted },
    authenticated: true,
  });
}
