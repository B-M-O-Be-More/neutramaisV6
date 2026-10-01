import { NextRequest, NextResponse } from "next/server";

import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/mfa/enroll → identity-api POST /auth/mfa/enroll
//
// Início do cadastro de MFA obrigatório no primeiro login (NEU-479). Não há
// sessão ainda: a credencial é o `enrollment_token` de uso único devolvido pelo
// login, junto da senha atual, ambos no corpo. Por isso a chamada vai SEM
// Authorization — nem um access_token antigo esquecido no cookie é anexado.
//
// A resposta traz segredos exibidos uma única vez (otpauth_uri, manual_key,
// recovery_codes) e a credencial de confirmação. Eles precisam chegar ao
// browser para a tela renderizar o QR localmente, então o corpo é repassado
// como veio — mas com `no-store`, para nenhum cache intermediário guardá-lo.
export async function POST(request: NextRequest) {
  const payload = await request.json();

  const result = await callIdentity({
    method: "POST",
    path: "/auth/mfa/enroll",
    body: payload,
    anonymous: true,
  });

  if (result.infraError) {
    return envelopeError(
      result.infraError.status,
      result.infraError.code,
      result.infraError.detail,
    );
  }

  return new NextResponse(result.text, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
    },
  });
}
