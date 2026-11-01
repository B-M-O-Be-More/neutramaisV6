import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { forwardToGeo } from "@/server/geoProxy";
import { envelopeError } from "@/server/identityProxy";

// BFF: GET /api/geo/organizations/{organizationId}/storage
//   → geo-api GET /geo/organizations/{organization_id}/storage
// Cota de armazenamento de cobertura (KMZ) da organização: cota, consumo,
// saldo e consumo por categoria, em MB (1 MB = 1.000.000 bytes). Membros leem
// a própria organização; o `super_admin` lê qualquer uma (403 nos demais).
export async function GET(
  _request: NextRequest,
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

  return forwardToGeo({
    method: "GET",
    path: `/geo/organizations/${organizationId}/storage`,
  });
}
