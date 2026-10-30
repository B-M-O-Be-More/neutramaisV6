import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
  REMEMBER_COOKIE,
  clearProfileCookies,
} from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";
import {
  passthrough,
  profileContextResponse,
  profileTokenResponse,
} from "@/server/profileSession";

// BFF: /api/auth/context → identity-api /auth/context (sessão de perfil).

const PROFILES = ["buyer", "seller"];

// POST: seleciona o perfil com o token do LOGIN e abre a sessão de perfil.
// Só `profile` segue no corpo — papel, organização e permissões a
// identity-api tira do cadastro e da sessão (o contrato rejeita o resto).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const profile = body?.profile;

  if (typeof profile !== "string" || !PROFILES.includes(profile)) {
    return envelopeError(
      422,
      "validation_error",
      "profile deve ser buyer ou seller.",
    );
  }

  const store = await cookies();
  const loginToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!loginToken) {
    return envelopeError(401, "NO_SESSION", "Sessão inexistente ou expirada.");
  }

  const result = await callIdentity({
    method: "POST",
    path: "/auth/context",
    body: { profile },
    authToken: loginToken,
  });
  // A sessão de perfil segue o "manter conectado" do login.
  return profileTokenResponse(result, store.has(REMEMBER_COOKIE));
}

// GET: contexto atual da sessão de perfil (organização, perfil, papéis,
// permissões, KYC, elegibilidade e versões), validado pela identity-api.
export async function GET() {
  const token = (await cookies()).get(PROFILE_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return envelopeError(
      401,
      "NO_PROFILE_SESSION",
      "Nenhum perfil selecionado nesta sessão.",
    );
  }

  const result = await callIdentity({
    method: "GET",
    path: "/auth/context",
    authToken: token,
  });
  return profileContextResponse(result);
}

// DELETE: encerra só a sessão de perfil (o login continua). Os cookies do
// perfil saem no sucesso — ou se já não havia sessão para encerrar.
export async function DELETE() {
  const token = (await cookies()).get(PROFILE_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    const res = new NextResponse(null, { status: 204 });
    clearProfileCookies(res);
    return res;
  }

  const result = await callIdentity({
    method: "DELETE",
    path: "/auth/context",
    authToken: token,
  });
  if (result.status !== 204) return passthrough(result);

  const res = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  clearProfileCookies(res);
  return res;
}
