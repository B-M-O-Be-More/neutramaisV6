import { NextRequest } from "next/server";

import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

const TOTP_PATTERN = /^\d{6}$/;

// BFF: POST /api/users/me/mfa/confirm → identity-api POST /users/me/mfa/confirm
// Confirma o cadastro com o primeiro código do autenticador. 401
// INVALID_MFA_CODE com o código errado; 404 sem cadastro pendente.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const totpCode = body?.totp_code;

  if (typeof totpCode !== "string" || !TOTP_PATTERN.test(totpCode)) {
    return envelopeError(
      422,
      "validation_error",
      "totp_code deve ter 6 dígitos.",
    );
  }

  return forwardToIdentity({
    method: "POST",
    path: "/users/me/mfa/confirm",
    body: { totp_code: totpCode },
  });
}
