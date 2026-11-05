import { NextRequest } from "next/server";

import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/users/me/mfa/enroll → identity-api POST /users/me/mfa/enroll
// Começa o cadastro do autenticador (TOTP) do usuário da sessão; exige a senha
// atual (RN-584). Devolve uma única vez `otpauth_uri` e `recovery_codes`.
// 403 INVALID_CREDENTIALS com a senha errada; 409 MFA_ALREADY_ENROLLED.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !password) {
    return envelopeError(422, "validation_error", "Informe a senha atual.");
  }

  return forwardToIdentity({
    method: "POST",
    path: "/users/me/mfa/enroll",
    body: { password },
  });
}
