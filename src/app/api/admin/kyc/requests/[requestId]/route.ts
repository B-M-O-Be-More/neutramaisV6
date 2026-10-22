import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
} from "@/server/complianceProxy";

// Paginação do histórico aceita pelo upstream. Só estes são repassados.
const ALLOWED_PARAMS = ["history_limit", "history_offset"] as const;

// BFF: GET /api/admin/kyc/requests/{requestId}
//   → compliance-api GET /admin/kyc/requests/{request_id}
// Detalhe da solicitação (documentos, checagens e histórico), sem efeito
// colateral. Exige `kyc:approve` com MFA.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!isUuid(requestId)) return invalidIdResponse();

  const { searchParams } = request.nextUrl;
  const query = new URLSearchParams();
  for (const key of ALLOWED_PARAMS) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  return forwardToCompliance({
    method: "GET",
    path: `/admin/kyc/requests/${requestId}${qs ? `?${qs}` : ""}`,
  });
}
