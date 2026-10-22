import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/{orgId}/kyc/artifacts
//   → identity-api POST /organizations/{org_id}/kyc/artifacts
//
// Envia UM documento e devolve o id do artefato confirmado. O formato normal é
// `multipart/form-data` com `document_type`, `kyc_level_supported` e `file`
// (o backend verifica os bytes e guarda uma cópia imutável). O JSON antigo,
// que referencia um objeto já existente no storage privado, segue repassado.
//
// Rota autenticada: exige `kyc:submit` sobre a própria organização — ver
// `resolveFlowAuthToken`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const multipart = request.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("multipart/form-data");
  const body = multipart ? await request.formData() : await request.json();

  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/kyc/artifacts`,
    body,
    authToken: await resolveFlowAuthToken(),
  });
}
