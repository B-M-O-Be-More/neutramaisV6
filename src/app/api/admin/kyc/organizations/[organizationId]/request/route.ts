import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/organizations/{organizationId}/request
//   → compliance-api POST /admin/kyc/organizations/{organization_id}/request
// Abre (ou sincroniza com o snapshot do Identity) a solicitação de KYC da
// organização. Sem corpo. Devolve `request_id` e `version` para as próximas
// chamadas. Exige `kyc:approve` com MFA.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  if (!isUuid(organizationId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/organizations/${organizationId}/request`,
  });
}
