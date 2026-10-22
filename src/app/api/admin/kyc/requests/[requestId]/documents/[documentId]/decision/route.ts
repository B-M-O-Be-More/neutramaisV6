import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
  readJsonBody,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/requests/{requestId}/documents/{documentId}/decision
//   → compliance-api POST .../documents/{document_id}/decision
// Aprova ou recusa um documento. Cada chamada leva o `expected_version` da
// última resposta e o `document_version` do documento.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string; documentId: string }> },
) {
  const { requestId, documentId } = await params;
  if (!isUuid(requestId) || !isUuid(documentId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/documents/${documentId}/decision`,
    body: (await readJsonBody(request)) ?? {},
  });
}
