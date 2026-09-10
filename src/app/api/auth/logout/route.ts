import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/server/authCookies";
import { callIdentity } from "@/server/identityProxy";

// BFF: POST /api/auth/logout → identity-api POST /auth/logout
// Revoga o refresh token no upstream (best-effort) e limpa os cookies da sessão.
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best-effort: mesmo que o upstream falhe, limpamos a sessão local.
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
