import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError } from "@/server/identityProxy";

/**
 * Corpo multipart do envio (e da prévia) de KMZ, só com os campos do
 * contrato: `organization_id`, `file` e `predecessor_id` opcional. Campo
 * inválido devolve o 422 pronto.
 */
export async function readKmzForm(
  request: NextRequest,
): Promise<FormData | NextResponse> {
  const form = await request.formData();
  const organizationId = form.get("organization_id");
  const file = form.get("file");
  const predecessorId = form.get("predecessor_id");

  if (typeof organizationId !== "string" || !isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organization_id deve ser um UUID.",
    );
  }
  if (!(file instanceof File)) {
    return envelopeError(422, "validation_error", "Arquivo KMZ obrigatório.");
  }

  const body = new FormData();
  body.append("organization_id", organizationId);
  body.append("file", file, file.name);
  if (typeof predecessorId === "string" && isUuid(predecessorId)) {
    body.append("predecessor_id", predecessorId);
  }
  return body;
}
