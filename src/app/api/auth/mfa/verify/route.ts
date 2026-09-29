import { NextRequest, NextResponse } from "next/server";

import { setAuthCookies } from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/mfa/verify → identity-api POST /auth/mfa/verify
//
// Resolve o desafio de MFA aberto pelo login. A credencial aqui é o
// `mfa_challenge_token` (não há Bearer ainda — o login não devolveu tokens),
// e o corpo carrega EXATAMENTE UM de `totp_code` | `recovery_code`.
//
// Em sucesso o upstream devolve o par final de tokens; seguindo o ADR-002 eles
// são gravados em cookies httpOnly e removidos do corpo. `rememberMe` é sinal
// só do front (a identity-api não o recebe) e precisa acompanhar o desafio para
// que a sessão criada aqui respeite a escolha feita na tela de login.
//
// O upstream recusa campos desconhecidos (`extra_forbidden`), então `rememberMe`
// é retirado do corpo aqui — nunca é encaminhado.
export async function POST(request: NextRequest) {
  const { rememberMe, ...payload } = await request.json();

  const result = await callIdentity({
    method: "POST",
    path: "/auth/mfa/verify",
    body: payload,
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
      { status: result.status },
    );
    setAuthCookies(
      res,
      { accessToken: access_token, refreshToken: refresh_token },
      Boolean(rememberMe),
    );
    return res;
  }

  // 401 INVALID_MFA_CODE (mesmo código para TOTP e recovery inválidos — o
  // upstream não distingue de propósito) ou qualquer outro erro: passthrough.
  return new NextResponse(result.text, {
    status: result.status,
    headers: { "Content-Type": result.contentType },
  });
}
