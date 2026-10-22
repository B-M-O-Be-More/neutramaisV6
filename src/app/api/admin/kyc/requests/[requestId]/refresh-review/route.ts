import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/requests/{requestId}/refresh-review
//   → compliance-api POST /admin/kyc/requests/{request_id}/refresh-review
// Sem corpo. Só vale depois de uma decisão com `application_error =
// kyc_decision_snapshot_stale`: volta a solicitação para `submitted` com o
// snapshot atual do Identity.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!isUuid(requestId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/refresh-review`,
  });
}
