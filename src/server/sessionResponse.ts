import "server-only";

import { NextResponse } from "next/server";

import { setAuthCookies } from "./authCookies";
import { envelopeError, type IdentityCallResult } from "./identityProxy";

/**
 * Resposta do BFF para chamadas da identity-api que podem abrir uma sessão
 * (ADR-002): com `access_token` e `refresh_token` no corpo, eles viram cookies
 * httpOnly e saem do JSON; sem eles (erro, MFA pendente, conta sem sessão), o
 * corpo segue como veio. Sempre `no-store`: há credenciais de curta duração.
 */
export function sessionResponse(
  result: IdentityCallResult,
  rememberMe = false,
): NextResponse {
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
      rememberMe,
    );
    return res;
  }

  return new NextResponse(result.text, {
    status: result.status,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "no-store",
    },
  });
}
