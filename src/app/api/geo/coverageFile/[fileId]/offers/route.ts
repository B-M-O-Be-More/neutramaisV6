import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageFile/{fileId}/offers
//   → geo-api GET /geo/coverageFile/{file_id}/offers
// Ofertas ligadas ao arquivo lógico: `offeringId`, `versionId` (a versão
// vinculada) e `updatedAt`.
// Página com `items`, `total`, `offset` e `limit` (1 a 200, padrão 50).
// Exige `organization_id` da sessão de perfil.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const { searchParams } = request.nextUrl;
  const organizationId = searchParams.get("organization_id");
  const offset = searchParams.get("offset");
  const limit = searchParams.get("limit");

  if (!isUuid(fileId)) {
    return envelopeError(422, "validation_error", "fileId deve ser um UUID.");
  }
  if (!organizationId || !isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organization_id deve ser um UUID.",
    );
  }
  if (offset && !/^\d+$/.test(offset)) {
    return envelopeError(422, "validation_error", "offset deve ser um número.");
  }
  if (limit && !/^\d+$/.test(limit)) {
    return envelopeError(422, "validation_error", "limit deve ser um número.");
  }

  return forwardToGeo({
    method: "GET",
    path: `/geo/coverageFile/${fileId}/offers`,
    params: { organization_id: organizationId, offset, limit },
  });
}
