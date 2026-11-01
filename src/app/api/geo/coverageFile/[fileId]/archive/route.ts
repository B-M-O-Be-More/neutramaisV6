import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import {
  isPreviewRevision,
  readCoverageFileCommand,
} from "@/server/coverageFileCommand";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: POST /api/geo/coverageFile/{fileId}/archive
//   → geo-api POST /geo/coverageFile/{file_id}/archive
// Arquiva o arquivo lógico (só o Dono). Corpo: `organization_id`,
// `expectedRevision` (o `previewRevision` do preview) e `idempotencyKey`.
// Com ofertas vinculadas, também `replacementFileId` e `replacementRevision`
// (arquivo ativo da mesma organização que recebe as ofertas). 409 quando o
// preview ficou velho ou o substituto não serve.
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
  if (!command) {
    return envelopeError(
      422,
      "validation_error",
      "Informe organization_id, expectedRevision e idempotencyKey.",
    );
  }

  const replacementFileId = body?.replacementFileId;
  const replacementRevision = body?.replacementRevision;
  const hasReplacement =
    replacementFileId !== undefined || replacementRevision !== undefined;
  if (
    hasReplacement &&
    !(
      typeof replacementFileId === "string" &&
      isUuid(replacementFileId) &&
      replacementFileId !== fileId &&
      isPreviewRevision(replacementRevision)
    )
  ) {
    return envelopeError(
      422,
      "validation_error",
      "replacementFileId e replacementRevision devem vir juntos e válidos.",
    );
  }

  return forwardToGeo({
    method: "POST",
    path: `/geo/coverageFile/${fileId}/archive`,
    body: hasReplacement
      ? { ...command, replacementFileId, replacementRevision }
      : command,
  });
}
