import { cookies } from "next/headers";

import {
  PROFILE_REFRESH_TOKEN_COOKIE,
  REMEMBER_COOKIE,
  clearProfileCookies,
} from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";
import { profileTokenResponse } from "@/server/profileSession";

// BFF: POST /api/auth/context/refresh → identity-api POST /auth/context/refresh
//
// Renova a sessão de perfil com o refresh_token DELA (cookie httpOnly) — não
// o do login, que vai para /api/auth/refresh. O endpoint não exige Bearer. O
// novo par substitui os dois cookies juntos: o refresh anterior não vale mais
// (reutilizá-lo revoga a família inteira).
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(PROFILE_REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return envelopeError(
      401,
      "NO_PROFILE_SESSION",
      "Nenhum perfil selecionado nesta sessão.",
    );
  }

  const result = await callIdentity({
    method: "POST",
    path: "/auth/context/refresh",
    body: { refresh_token: refreshToken },
    anonymous: true,
  });

  const res = profileTokenResponse(result, store.has(REMEMBER_COOKIE));
  // Refresh recusado (expirado, revogado, reutilizado): a sessão de perfil
  // acabou. Falha de infraestrutura (5xx) mantém os cookies para tentar de novo.
  if (!result.infraError && result.status >= 400 && result.status < 500) {
    clearProfileCookies(res);
  }
  return res;
}
