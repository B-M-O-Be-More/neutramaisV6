import { NextRequest } from "next/server";

import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/{orgId}/users
//   → identity-api POST /organizations/{org_id}/users
// Criação do usuário-raiz logo após o cadastro da organização.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const body = await request.json();
  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/users`,
    body,
  });
}
