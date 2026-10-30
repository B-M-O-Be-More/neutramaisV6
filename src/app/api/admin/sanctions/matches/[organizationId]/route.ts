import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/admin/sanctions/matches/{organizationId}
//   → identity-api GET /admin/sanctions/matches/{organization_id}
// Ocorrências de sanções da organização: lista (OFAC, ONU, BACEN), score,
// data e disposição. Exige `sanctions:read_matches`.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;

  if (!isUuid(organizationId)) {
    return envelopeError(
      422,
      "validation_error",
      "organization_id deve ser um UUID.",
    );
  }

  return forwardToIdentity({
    method: "GET",
    path: `/admin/sanctions/matches/${organizationId}`,
  });
}
