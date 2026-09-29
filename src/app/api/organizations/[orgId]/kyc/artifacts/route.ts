import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/{orgId}/kyc/artifacts
//   → identity-api POST /organizations/{org_id}/kyc/artifacts
//
// Declara o metadado de UM documento (o binário vive no S3). O cadastro não
// passa por aqui: lá os documentos vão todos juntos no /kyc/submit. Esta rota
// segue disponível para declarar artefatos avulsos fora daquele fluxo.
//
// Rota autenticada: exige `kyc:submit` sobre a própria organização — ver
// `resolveFlowAuthToken`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const body = await request.json();

  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/kyc/artifacts`,
    body,
    authToken: await resolveFlowAuthToken(),
  });
}
