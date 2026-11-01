import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageVersion/{versionId}
//   → geo-api GET /geo/coverageVersion/{id}
// Metadados de uma versão (id, organização, antecessora, SHA-256, data) —
// sem geometria. 404 se não existe; 403 se é de outra organização.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const { versionId } = await params;

  if (!isUuid(versionId)) {
    return envelopeError(
      422,
      "validation_error",
      "versionId deve ser um UUID.",
    );
  }

  return forwardToGeo({
    method: "GET",
    path: `/geo/coverageVersion/${versionId}`,
  });
}
