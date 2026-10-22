import { NextRequest } from "next/server";

import { readJsonBody } from "@/server/complianceProxy";
import { callIdentity } from "@/server/identityProxy";
import { sessionResponse } from "@/server/sessionResponse";

// Únicos campos aceitos pelo upstream; qualquer outro seria recusado com 422.
const FIELDS = ["token", "display_name", "phone", "password"] as const;

// BFF: POST /api/invites/accept → identity-api POST /invites/accept (NEU-563)
//
// Aceite único para convites de organização e de plataforma: o Identity
// descobre o tipo pelo token salvo. Pública — o token é a credencial, então a
// chamada sai SEM o Bearer de uma sessão que esteja aberta no browser.
//
// Convite de organização sem MFA obrigatório já devolve a sessão: os tokens
// viram cookies httpOnly e saem do corpo. O `mfa_enrollment_token` segue para
// o browser, que o guarda só em memória até concluir o cadastro do MFA.
export async function POST(request: NextRequest) {
  const body = ((await readJsonBody(request)) ?? {}) as Record<string, unknown>;
  const payload = Object.fromEntries(
    FIELDS.filter((key) => body[key] !== undefined).map((key) => [
      key,
      body[key],
    ]),
  );

  const result = await callIdentity({
    method: "POST",
    path: "/invites/accept",
    body: payload,
    anonymous: true,
  });

  return sessionResponse(result);
}
