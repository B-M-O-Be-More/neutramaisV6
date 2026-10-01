import { NextRequest, NextResponse } from "next/server";

import { setAuthCookies } from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/mfa/enroll/confirm → identity-api POST /auth/mfa/enroll/confirm
//
// Conclui o cadastro de MFA do primeiro login (NEU-479) com o primeiro TOTP do
// autenticador recém-configurado. Assim como no /enroll, a credencial vai no
// corpo (`enrollment_token` de confirmação) e a chamada sai SEM Authorization.
//
// Só aqui nasce a sessão: em sucesso o upstream devolve o par de tokens (já com
// mfa=true) e, seguindo o ADR-002, eles viram cookies httpOnly e saem do corpo —
// o mesmo tratamento do /auth/mfa/verify. `rememberMe` é sinal só do front e é
// retirado do corpo antes do encaminhamento.
export async function POST(request: NextRequest) {
  const { rememberMe, ...payload } = await request.json();

  const result = await callIdentity({
    method: "POST",
    path: "/auth/mfa/enroll/confirm",
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

  let envelope: {
    data?: { access_token?: string; refresh_token?: string } | null;
  } | null = null;
  try {
    envelope = JSON.parse(result.text);
  } catch {
    // corpo não-JSON — repassa verbatim abaixo.
  }

  const data = envelope?.data;

  if (result.ok && data?.access_token && data?.refresh_token) {
    const { access_token, refresh_token, ...safeData } = data;
    const res = NextResponse.json(
      { ...envelope, data: safeData },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
    setAuthCookies(
      res,
      { accessToken: access_token, refreshToken: refresh_token },
      Boolean(rememberMe),
    );
    return res;
  }

  // 401 INVALID_MFA_CODE / MFA_ENROLLMENT_TOKEN_INVALID, 409, 429, 5xx…:
  // passthrough — o hook decide a retomada pelo metadata.code.
  return new NextResponse(result.text, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
    },
  });
}
