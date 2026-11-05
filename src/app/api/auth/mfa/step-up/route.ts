import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  PROFILE_ACCESS_TOKEN_COOKIE,
  REMEMBER_COOKIE,
  setAuthCookies,
  setProfileCookies,
} from "@/server/authCookies";
import { readJsonBody } from "@/server/complianceProxy";
import { callIdentity, envelopeError } from "@/server/identityProxy";
import { passthrough } from "@/server/profileSession";

const TOTP_CODE = /^\d{6}$/;

// BFF: POST /api/auth/mfa/step-up → identity-api POST /auth/mfa/step-up
//
// Prova o app autenticador dentro da sessão atual e emite um par novo com
// `mfa: true` — pedido por rotas que exigem MFA (ex.: 403 `mfa_required` da
// payment-api). Com sessão de perfil, é ela que sobe (o token tem `sid`, e a
// família inteira passa a ter MFA): o par vai para os cookies do perfil.
// Sem perfil, sobe a sessão do login. Os tokens nunca vão para o browser.
export async function POST(request: NextRequest) {
  const body = (await readJsonBody(request)) as { totp_code?: unknown } | null;
  const totpCode = typeof body?.totp_code === "string" ? body.totp_code : "";
  if (!TOTP_CODE.test(totpCode)) {
    return envelopeError(
      422,
      "validation_error",
      "totp_code deve ter 6 dígitos.",
    );
  }

  const store = await cookies();
  const profileToken = store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value;
  const result = await callIdentity({
    method: "POST",
    path: "/auth/mfa/step-up",
    body: { totp_code: totpCode },
    // Sem token explícito, o callIdentity usa o do login.
    authToken: profileToken,
  });

  let data: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(result.text) as { data?: unknown };
    data =
      parsed.data && typeof parsed.data === "object"
        ? (parsed.data as Record<string, unknown>)
        : null;
  } catch {
    data = null;
  }
  const accessToken = data?.access_token;
  const refreshToken = data?.refresh_token;
  if (
    !result.ok ||
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string"
  ) {
    return passthrough(result);
  }

  const res = NextResponse.json(
    {
      message: "",
      data: {
        mfa: true,
        profile: data?.profile ?? null,
        expires_in: data?.expires_in ?? null,
      },
      errors: null,
      metadata: null,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
  const persistent = store.has(REMEMBER_COOKIE);
  const tokens = { accessToken, refreshToken };
  if (profileToken) setProfileCookies(res, tokens, persistent);
  else setAuthCookies(res, tokens, persistent);
  return res;
}
