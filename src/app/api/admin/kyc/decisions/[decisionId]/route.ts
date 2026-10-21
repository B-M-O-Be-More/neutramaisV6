import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
} from "@/server/complianceProxy";

// BFF: GET /api/admin/kyc/decisions/{decisionId}
//   → compliance-api GET /admin/kyc/decisions/{decision_id}
// Leitura da decisão da conta (inclui `activation_status` e
// `application_error`). Não tenta aplicar de novo.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ decisionId: string }> },
) {
  const { decisionId } = await params;
  if (!isUuid(decisionId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "GET",
    path: `/admin/kyc/decisions/${decisionId}`,
  });
}
