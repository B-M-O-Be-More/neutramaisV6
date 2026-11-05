import { NextRequest } from "next/server";

import { isUuid } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: GET /api/admin/organizations/{organizationId}
//   → identity-api GET /admin/organizations/{organization_id}
// Dados de uma organização para o painel admin: tipo, status, KYC, razão
// social, documento mascarado, contato e data de cadastro. Exige
// `org:suspend`; 404 quando não existe.
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
    path: `/admin/organizations/${organizationId}`,
  });
}
