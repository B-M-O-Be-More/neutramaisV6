import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/organizations/{orgId}/kyc/status
//   → identity-api GET /organizations/{org_id}/kyc/status
// Rota autenticada (bearer via cookie httpOnly).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  return forwardToIdentity({
    method: "GET",
    path: `/organizations/${orgId}/kyc/status`,
  });
}
