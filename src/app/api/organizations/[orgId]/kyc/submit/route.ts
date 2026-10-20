import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/{orgId}/kyc/submit
//   → identity-api POST /organizations/{org_id}/kyc/submit
//
// Envia para análise os artefatos já registrados no /kyc/artifacts: o corpo
// leva só os ids, em `{ artifact_ids: [...] }`. O BFF repassa o corpo como
// veio.
//
// Rota autenticada (`kyc:submit` sobre a própria organização). No cadastro ainda
// não há sessão, então o Bearer sai do mesmo lugar que no /artifacts — ver
// `resolveFlowAuthToken`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  // O corpo é opcional: um POST sem payload não é JSON parseável.
  let body: unknown = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  return forwardToIdentity({
    method: "POST",
    path: `/organizations/${orgId}/kyc/submit`,
    body,
    authToken: await resolveFlowAuthToken(),
  });
}
