import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/coverageVersion/{versionId}/elements
//   → geo-api GET /geo/coverageVersion/{id}/elements
// Placemarks da versão, com geometria (as áreas que o seller escolhe para a
// oferta). Página com `items` (cada um com `placemarkIndex`, `name`,
// `folderPath`, `geometry` e `geometryKinds`), `hasMore` e `nextCursor`.
// Aceita `after_index` (≥ -1, continua do `nextCursor`), `limit` (1 a 500) e
// `tolerance` (simplificação em graus, 0 a 1). 403 em outra organização.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const { versionId } = await params;
  const { searchParams } = request.nextUrl;
  const afterIndex = searchParams.get("after_index");
  const limit = searchParams.get("limit");
  const tolerance = searchParams.get("tolerance");

  if (!isUuid(versionId)) {
    return envelopeError(
      422,
      "validation_error",
      "versionId deve ser um UUID.",
    );
  }
  if (afterIndex && !/^(-1|\d+)$/.test(afterIndex)) {
    return envelopeError(
      422,
      "validation_error",
      "after_index deve ser -1 ou um número.",
    );
  }
  if (limit && (!/^\d+$/.test(limit) || +limit < 1 || +limit > 500)) {
    return envelopeError(
      422,
      "validation_error",
      "limit deve ser um número de 1 a 500.",
    );
  }
  if (
    tolerance &&
    (!/^\d+(\.\d+)?$/.test(tolerance) || Number(tolerance) > 1)
  ) {
    return envelopeError(
      422,
      "validation_error",
      "tolerance deve ser um número de 0 a 1.",
    );
  }

  // Só os parâmetros que a tela usa seguem para o upstream.
  return forwardToGeo({
    method: "GET",
    path: `/geo/coverageVersion/${versionId}/elements`,
    params: { after_index: afterIndex, limit, tolerance },
  });
}
