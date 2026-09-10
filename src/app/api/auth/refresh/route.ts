import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  REFRESH_TOKEN_COOKIE,
  REMEMBER_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: POST /api/auth/refresh → identity-api POST /auth/refresh
//
// Troca o refresh_token por um novo par. O browser não envia nada: o
// refresh_token vive em cookie httpOnly (ADR-002) e é lido aqui. O novo par
// volta para os cookies e o corpo segue sem tokens.
//
// Se o refresh falhar, a sessão acabou — limpamos os cookies para não deixar
// credencial morta no browser.
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  // Preserva a escolha de "manter conectado" feita no login: o novo par é
  // reemitido persistente só se a sessão atual já era.
  const persistent = store.has(REMEMBER_COOKIE);

  if (!refreshToken) {
    return envelopeError(
      401,
      "NO_REFRESH_TOKEN",
      "Sessão inexistente ou expirada.",
    );
  }

  const result = await callIdentity({
    method: "POST",
    path: "/auth/refresh",
    body: { refresh_token: refreshToken },
    // Não anexa o access_token expirado — a credencial aqui é o refresh_token.
    authToken: "",
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
    // corpo não-JSON — tratado abaixo.
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
      persistent,
    );
    return res;
  }

  // Refresh recusado (token revogado/expirado) → encerra a sessão local.
  const res = new NextResponse(result.text, {
    status: result.status,
    headers: { "Content-Type": result.contentType },
  });
  clearAuthCookies(res);
  return res;
}
