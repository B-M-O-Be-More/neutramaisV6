import { NextRequest } from "next/server";

import {
  forwardToCompliance,
  invalidIdResponse,
  isUuid,
  readJsonBody,
} from "@/server/complianceProxy";

const IDEMPOTENCY_HEADER = "Idempotency-Key";

// BFF: POST /api/admin/kyc/requests/{requestId}/decision
//   → compliance-api POST /admin/kyc/requests/{request_id}/decision
// Decisão da conta. O `Idempotency-Key` do browser é repassado: repetir a
// chamada com a mesma chave e o mesmo corpo reaplica a decisão já gravada.
// Sem a chave o upstream responde 422.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  if (!isUuid(requestId)) return invalidIdResponse();

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);

  return forwardToCompliance({
    method: "POST",
    path: `/admin/kyc/requests/${requestId}/decision`,
    body: (await readJsonBody(request)) ?? {},
    headers: idempotencyKey ? { [IDEMPOTENCY_HEADER]: idempotencyKey } : {},
  });
}
