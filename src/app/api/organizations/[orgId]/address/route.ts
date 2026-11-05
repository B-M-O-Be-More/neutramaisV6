import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/organizations/{orgId}/address
//   → identity-api GET /organizations/{org_id}/address
// Endereço legal (sede) da organização: rua, complemento, cidade, estado, CEP
// e país (ADR-0023).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  if (!isUuid(orgId)) {
    return envelopeError(422, "validation_error", "orgId deve ser um UUID.");
  }

  return forwardToIdentity({
    method: "GET",
    path: `/organizations/${orgId}/address`,
  });
}
