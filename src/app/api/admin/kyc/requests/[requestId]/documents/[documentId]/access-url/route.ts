import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
  readJsonBody,
} from "@/server/complianceProxy";

// BFF: POST /api/admin/kyc/requests/{requestId}/documents/{documentId}/access-url
//   → compliance-api POST .../documents/{document_id}/access-url
// Body `{purpose: "view" | "download"}`. Devolve uma URL assinada de curta
// duração (`url`, `expires_at`), aberta direto, sem Authorization.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string; documentId: string }> },
) {
  const { requestId, documentId } = await params;
  if (!isUuid(requestId) || !isUuid(documentId)) return invalidIdResponse();

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/documents/${documentId}/access-url`,
    body: (await readJsonBody(request)) ?? {},
  });
}
