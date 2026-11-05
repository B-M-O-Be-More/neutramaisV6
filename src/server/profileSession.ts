import "server-only";

import { NextResponse } from "next/server";

import { setProfileCookies } from "./authCookies";
import {
  CORRELATION_ID_HEADER,
  envelopeError,
  type IdentityCallResult,
} from "./identityProxy";

// As rotas /auth/context da identity-api respondem SEM o ResponseEnvelope
// (o corpo é o próprio objeto). O BFF devolve o sucesso dentro do envelope,
// como as demais rotas, para o api.client desembrulhar igual; erros seguem
// verbatim. Sempre `no-store`: há credenciais e contexto de autorização.

function parse(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function headersOf(result: IdentityCallResult): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    ...(result.correlationId
      ? { [CORRELATION_ID_HEADER]: result.correlationId }
      : {}),
  };
}

function enveloped(result: IdentityCallResult, data: unknown): NextResponse {
  return NextResponse.json(
    { message: "", data, errors: null, metadata: null },
    { status: result.status, headers: headersOf(result) },
  );
}

/** Erro (ou corpo inesperado) da identity-api, como veio. */
export function passthrough(result: IdentityCallResult): NextResponse {
  if (result.infraError) {
    return envelopeError(
      result.infraError.status,
      result.infraError.code,
      result.infraError.detail,
    );
  }
  return new NextResponse(result.text, {
    status: result.status,
    headers: { "Content-Type": result.contentType, ...headersOf(result) },
  });
}

/**
 * Resposta de `POST /auth/context` e `POST /auth/context/refresh`: o par
 * novo vai para os cookies httpOnly do perfil e sai do corpo, que leva só
 * `token_type`, `expires_in`, `profile` e `context_version`.
 */
export function profileTokenResponse(
  result: IdentityCallResult,
  persistent: boolean,
): NextResponse {
  const body = parse(result.text);
  if (!result.ok || !body) return passthrough(result);

  const { access_token, refresh_token, ...session } = body;
  if (typeof access_token !== "string" || typeof refresh_token !== "string") {
    return passthrough(result);
  }

  const res = enveloped(result, session);
  setProfileCookies(
    res,
    { accessToken: access_token, refreshToken: refresh_token },
    persistent,
  );
  return res;
}

/** Resposta de `GET /auth/context`: o contexto validado pela identity-api. */
export function profileContextResponse(
  result: IdentityCallResult,
): NextResponse {
  const body = parse(result.text);
  return result.ok && body ? enveloped(result, body) : passthrough(result);
}
