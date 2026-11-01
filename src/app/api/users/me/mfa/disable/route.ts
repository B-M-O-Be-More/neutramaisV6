import { NextRequest } from "next/server";

import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

const TOTP_PATTERN = /^\d{6}$/;

// BFF: POST /api/users/me/mfa/disable → identity-api POST /users/me/mfa/disable
// Desliga o 2FA opcional do usuário da sessão: exige a senha atual e um
// código válido (NEU-508). 409 MFA_REQUIRED_BY_ROLE quando o papel exige 2FA;
// 401 INVALID_MFA_CODE com senha ou código errados.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  const totpCode = body?.totp_code;

  if (
    typeof password !== "string" ||
    !password ||
    typeof totpCode !== "string" ||
    !TOTP_PATTERN.test(totpCode)
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Informe a senha atual e o código de 6 dígitos.",
    );
  }

  return forwardToIdentity({
    method: "POST",
    path: "/users/me/mfa/disable",
    body: { password, totp_code: totpCode },
  });
}
