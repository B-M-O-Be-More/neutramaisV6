import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/offerCoverage/{offeringId}
//   → geo-api GET /geo/offerCoverage/{offering_id}
// Cobertura vinculada à oferta: `offeringId`, `coverageVersionId` e o
// `publicGeometry` salvo (Polygon/MultiPolygon; null = o KMZ inteiro). Só
// faz sentido quando a oferta (GET /productOffering) tem `coverageVersionId`.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> },
) {
  const { offeringId } = await params;

  if (!isUuid(offeringId)) {
    return envelopeError(
      422,
      "validation_error",
      "offeringId deve ser um UUID.",
    );
  }

  return forwardToGeo({
    method: "GET",
    path: `/geo/offerCoverage/${offeringId}`,
  });
}
