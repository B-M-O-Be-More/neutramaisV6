import { NextRequest, NextResponse } from "next/server";

import { setAuthCookies } from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/login → identity-api POST /auth/login
// Rota pública. ADR-002: em vez de devolver os tokens ao browser, grava
// access_token/refresh_token em cookies httpOnly (respeitando rememberMe) e
// remove-os do corpo da resposta. `rememberMe` é um sinal só do front (a
// identity-api não o recebe).
export async function POST(request: NextRequest) {
  const { rememberMe, ...credentials } = await request.json();

  const result = await callIdentity({
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });

  if (result.infraError) {
    return envelopeError(
      result.infraError.status,
      result.infraError.code,
      result.infraError.detail,
    );
  }

  let envelope: {
    data?: {
      access_token?: string;
      refresh_token?: string;
      mfa_required?: boolean;
    } | null;
  } | null = null;
  try {
    envelope = JSON.parse(result.text);
  } catch {
    // corpo não-JSON — repassa verbatim abaixo.
  }

  const data = envelope?.data;

  // Sucesso e sem MFA pendente → estabelece a sessão via cookies e devolve o
  // corpo sem os tokens.
  if (
    result.ok &&
    data?.access_token &&
    data?.refresh_token &&
    !data.mfa_required
  ) {
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

  // MFA pendente (precisa do mfa_challenge_token no corpo) ou erro → passthrough.
  return new NextResponse(result.text, {
    status: result.status,
    headers: { "Content-Type": result.contentType },
  });
}
