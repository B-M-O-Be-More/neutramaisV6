import { NextRequest } from "next/server";

import { resolveFlowAuthToken } from "@/server/authCookies";
import { forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/organizations/{orgId}/kyc/submit
//   → identity-api POST /organizations/{org_id}/kyc/submit
//
// É por aqui que a documentação é enviada: o lote inteiro vai numa request só,
// em `{ artifacts: [...] }`, no mesmo formato de artefato do /kyc/artifacts.
// Sem corpo (ou com `{}`), o upstream avalia o que já estiver declarado.
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
