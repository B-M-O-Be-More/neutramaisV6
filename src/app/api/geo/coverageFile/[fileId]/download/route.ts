import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageFile/{fileId}/download
//   → geo-api GET /geo/coverageFile/{file_id}/download
// Bytes exatos do KMZ original retido (application/vnd.google-earth.kmz), da
// versão ativa ou da `version_id` informada. Exige `organization_id` da
// sessão. 404 quando a versão não tem o original retido.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const { searchParams } = request.nextUrl;
  const organizationId = searchParams.get("organization_id");
  const versionId = searchParams.get("version_id");

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
  if (versionId && !isUuid(versionId)) {
    return envelopeError(
      422,
      "validation_error",
      "version_id deve ser um UUID.",
    );
  }

  return forwardToGeo({
    method: "GET",
    path: `/geo/coverageFile/${fileId}/download`,
    params: { organization_id: organizationId, version_id: versionId },
    // Original de dezenas de MB: sem o corte de 300 s do fetch do Node.
    long: true,
    binary: true,
  });
}
