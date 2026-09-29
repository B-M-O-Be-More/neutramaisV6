import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { REFRESH_TOKEN_COOKIE } from "@/server/authCookies";
import { envelopeError, forwardToIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/revoke → identity-api POST /auth/revoke
//
// Revoga um refresh_token. O upstream identifica o token pelo próprio valor
// (campo `refresh_token`) e não pelo `jti` — ver nota em auth.service.ts.
//
// Se o corpo não trouxer um token, usamos o da sessão corrente (cookie httpOnly),
// já que sob o ADR-002 o browser não tem acesso a ele. Diferente do logout, os
// cookies locais NÃO são limpos: revoke é a operação crua de revogação.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const store = await cookies();
  const refreshToken =
    body?.refresh_token ?? store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return envelopeError(
      400,
      "NO_REFRESH_TOKEN",
      "Nenhum refresh_token informado nem presente na sessão.",
    );
  }

  return forwardToIdentity({
    method: "POST",
    path: "/auth/revoke",
    body: { refresh_token: refreshToken },
  });
}
