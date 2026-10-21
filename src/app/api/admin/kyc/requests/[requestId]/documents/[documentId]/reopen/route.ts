import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
  readJsonBody,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/requests/{requestId}/documents/{documentId}/reopen
//   → compliance-api POST .../documents/{document_id}/reopen
// Body `{expected_version}`. Devolve um documento já decidido para `pending`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string; documentId: string }> },
) {
  const { requestId, documentId } = await params;
  if (!isUuid(requestId) || !isUuid(documentId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/documents/${documentId}/reopen`,
    body: (await readJsonBody(request)) ?? {},
  });
}
