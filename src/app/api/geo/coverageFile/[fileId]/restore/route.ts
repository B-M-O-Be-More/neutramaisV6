import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { readCoverageFileCommand } from "@/server/coverageFileCommand";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: POST /api/geo/coverageFile/{fileId}/restore
//   → geo-api POST /geo/coverageFile/{file_id}/restore
// Torna ativa uma versão retida do mesmo arquivo ("Usar esta versão"), sem
// novo upload nem consumo de cota. Só o Dono. Corpo: `organization_id`,
// `expectedRevision`, `idempotencyKey`, `versionId` e `moveBindings` (padrão
// false: as ofertas continuam na versão em que estão).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  if (!isUuid(fileId)) {
    return envelopeError(422, "validation_error", "fileId deve ser um UUID.");
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const command = readCoverageFileCommand(body);
  const versionId = body?.versionId;
  const moveBindings = body?.moveBindings ?? false;
  if (
    !command ||
    typeof versionId !== "string" ||
    !isUuid(versionId) ||
    typeof moveBindings !== "boolean"
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Informe organization_id, expectedRevision, idempotencyKey e versionId.",
    );
  }

  return forwardToGeo({
    method: "POST",
    path: `/geo/coverageFile/${fileId}/restore`,
    body: { ...command, versionId, moveBindings },
  });
}
