import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageFile/{fileId}/preview
//   → geo-api GET /geo/coverageFile/{file_id}/preview
// Ciclo de vida de um arquivo lógico: metadados (versão ativa, `archived`,
// `revision`), `linkedOfferCount`, `previewRevision` e `replacementsPath`
// (arquivos ativos que podem substituí-lo). Não traz o mapa. Exige
// `organization_id` da sessão de perfil.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const organizationId = request.nextUrl.searchParams.get("organization_id");

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

  return forwardToGeo({
    method: "GET",
    path: `/geo/coverageFile/${fileId}/preview`,
    params: { organization_id: organizationId },
  });
}
