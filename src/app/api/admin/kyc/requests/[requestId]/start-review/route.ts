import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
  readJsonBody,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/requests/{requestId}/start-review
//   → compliance-api POST /admin/kyc/requests/{request_id}/start-review
// Body `{expected_version}`. Atribui a revisão a quem chamou.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!isUuid(requestId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/start-review`,
    body: (await readJsonBody(request)) ?? {},
  });
}
