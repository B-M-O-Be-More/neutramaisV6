import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  PROFILE_ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
} from "@/server/authCookies";
import { callIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/logout → identity-api POST /auth/logout
// Revoga o refresh token no upstream (best-effort) e limpa os cookies da sessão.
// Encerra antes a sessão de perfil (DELETE /auth/context), que tem refresh
// próprio e não cai junto com o do login.
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const profileToken = store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value;

  // Best-effort: mesmo que o upstream falhe, limpamos a sessão local.
  if (profileToken) {
    await callIdentity({
      method: "DELETE",
      path: "/auth/context",
      authToken: profileToken,
    });
  }

  if (refreshToken) {
    await callIdentity({
      method: "POST",
      path: "/auth/logout",
      body: { refresh_token: refreshToken },
    });
  }

  const res = new NextResponse(null, { status: 204 });
  clearAuthCookies(res);
  return res;
}
