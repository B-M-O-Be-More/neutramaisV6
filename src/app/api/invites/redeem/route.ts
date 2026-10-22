import { NextRequest } from "next/server";

import { isInviteToken } from "@/functions/inviteToken";
import { readJsonBody } from "@/server/complianceProxy";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/invites/redeem → identity-api POST /invites/{token}/redeem
//
// Conta existente aceitando um convite de organização (depois do 409 no
// aceite). O browser manda o token no corpo, para ele não aparecer em URL,
// histórico ou log de acesso; só aqui ele entra no path do upstream. O Bearer
// é o da sessão (cookie httpOnly) — o Identity tira dela quem está aceitando.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as { token?: unknown } | undefined;
  const token = body?.token;

  if (typeof token !== "string" || !isInviteToken(token)) {
    return envelopeError(422, "validation_error", "Convite inválido.");
  }

  const response = await forwardToIdentity({
    method: "POST",
    path: `/invites/${token}/redeem`,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
