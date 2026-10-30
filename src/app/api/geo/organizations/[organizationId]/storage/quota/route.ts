import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: PATCH /api/geo/organizations/{organizationId}/storage/quota
//   → geo-api PATCH /geo/organizations/{organization_id}/storage/quota
// Altera a cota de armazenamento de cobertura. Só o `super_admin` (403 nos
// demais). Corpo `{ quotaMb, reason }`: cota de 0 a 1000 MB com até seis
// casas decimais; a geo-api recusa campos extras (422) e registra ator, data,
// valor anterior, novo valor e motivo.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;

  if (!isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organizationId deve ser um UUID.",
    );
  }

  const body = (await request.json().catch(() => null)) as {
    quotaMb?: unknown;
    reason?: unknown;
  } | null;
  if (
    typeof body?.quotaMb !== "number" ||
    !Number.isFinite(body.quotaMb) ||
    typeof body.reason !== "string"
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Informe quotaMb (número) e reason (texto).",
    );
  }

  // Só os campos do contrato: a geo-api recusa qualquer outro.
  return forwardToGeo({
    method: "PATCH",
    path: `/geo/organizations/${organizationId}/storage/quota`,
    body: { quotaMb: body.quotaMb, reason: body.reason.trim() },
  });
}
