import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/organizations/{orgId}/members
//   → identity-api GET /organizations/{org_id}/members
// Membros da organização (usuário, e-mail, papel, status e entrada). Exige
// `org:manage_members`; a identity-api só lista a organização do próprio
// token e responde 403 para as demais.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  if (!isUuid(orgId)) {
    return envelopeError(422, "validation_error", "org_id deve ser um UUID.");
  }

  return forwardToIdentity({
    method: "GET",
    path: `/organizations/${orgId}/members`,
  });
}
