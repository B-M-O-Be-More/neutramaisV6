import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageFile → geo-api GET /geo/coverageFile
// Arquivos de cobertura (KMZ) da organização: cada item é um arquivo lógico
// (`fileId`) com a versão ativa, `archived` e `revision`. Página com `items`,
// `total`, `offset` e `limit` (1 a 200, padrão 50). Exige `organization_id`
// da sessão (403 em outra organização); aceita `active_only` e
// `exclude_file_id`.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const organizationId = searchParams.get("organization_id");
  const offset = searchParams.get("offset");
  const limit = searchParams.get("limit");
  const activeOnly = searchParams.get("active_only");
  const excludeFileId = searchParams.get("exclude_file_id");

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
  if (activeOnly && activeOnly !== "true" && activeOnly !== "false") {
    return envelopeError(
      422,
      "validation_error",
      "active_only deve ser true ou false.",
    );
  }
  if (excludeFileId && !isUuid(excludeFileId)) {
    return envelopeError(
      422,
      "validation_error",
      "exclude_file_id deve ser um UUID.",
    );
  }

  // Só os parâmetros do contrato seguem para o upstream.
  return forwardToGeo({
    method: "GET",
    path: "/geo/coverageFile",
    params: {
      organization_id: organizationId,
      offset,
      limit,
      active_only: activeOnly,
      exclude_file_id: excludeFileId,
    },
  });
}
