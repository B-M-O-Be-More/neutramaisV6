import "server-only";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

// Sessão do BFF (ADR-002): os tokens da identity-api ficam em cookies httpOnly,
// nunca acessíveis pelo JS do browser. As rotas autenticadas leem o access_token
// aqui (via identityProxy) e anexam o Bearer no upstream.
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
/**
 * Marca que a sessão foi criada com "manter conectado". Existe porque a API de
 * cookies só devolve o valor na leitura — não o maxAge —, então o /auth/refresh
 * não teria como saber se deve reemitir o novo par como persistente ou de
 * sessão. Presença do cookie = persistente.
 */
export const REMEMBER_COOKIE = "session_remember";

// "Manter conectado" → cookies persistentes por 30 dias; caso contrário, cookies
// de sessão (expiram ao fechar o navegador).
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  rememberMe: boolean,
): void {
  const persistent = rememberMe ? { maxAge: REMEMBER_MAX_AGE } : {};
  res.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions,
    ...persistent,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    ...persistent,
  });

  if (rememberMe) {
    res.cookies.set(REMEMBER_COOKIE, "1", {
      ...baseOptions,
      maxAge: REMEMBER_MAX_AGE,
    });
  } else {
    // Sessão não-persistente: garante que um "manter conectado" anterior não
    // sobreviva ao novo login.
    res.cookies.set(REMEMBER_COOKIE, "", { ...baseOptions, maxAge: 0 });
  }
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...baseOptions, maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...baseOptions, maxAge: 0 });
  res.cookies.set(REMEMBER_COOKIE, "", { ...baseOptions, maxAge: 0 });
}

// ---------------------------------------------------------------------------
// Contexto da confirmação de e-mail
//
// Não é sessão: o `GET /auth/confirm-email` não emite tokens. São só o `token` e
// o `user_id` que vieram no link, guardados no servidor para o resto do fluxo de
// cadastro (confirmação de telefone) tê-los sem depender do localStorage.
// httpOnly porque o browser não precisa lê-los — quem lê é o BFF.
// ---------------------------------------------------------------------------
export const CONFIRM_TOKEN_COOKIE = "email_confirm_token";
export const CONFIRM_USER_COOKIE = "email_confirm_user";

// Vida curta: é o bastante para concluir o cadastro na sequência, e o token é de
// uso único (já foi consumido pelo confirm-email quando chega aqui).
const CONFIRM_MAX_AGE = 60 * 60 * 2;

export function setEmailConfirmationCookies(
  res: NextResponse,
  { token, userId }: { token: string; userId: string },
): void {
  res.cookies.set(CONFIRM_TOKEN_COOKIE, token, {
    ...baseOptions,
    maxAge: CONFIRM_MAX_AGE,
  });
  res.cookies.set(CONFIRM_USER_COOKIE, userId, {
    ...baseOptions,
    maxAge: CONFIRM_MAX_AGE,
  });
}

export function clearEmailConfirmationCookies(res: NextResponse): void {
  res.cookies.set(CONFIRM_TOKEN_COOKIE, "", { ...baseOptions, maxAge: 0 });
  res.cookies.set(CONFIRM_USER_COOKIE, "", { ...baseOptions, maxAge: 0 });
}

/**
 * Bearer para as rotas autenticadas alcançadas DURANTE o cadastro (KYC:
 * artifacts e submit). Ali ainda não há sessão — nem o register nem o
 * confirm-email emitem tokens hoje —, então, na falta do `access_token`, cai no
 * token da confirmação de e-mail: é a única credencial que o usuário tem nesse
 * ponto.
 *
 * `undefined` significa "deixe o identityProxy resolver": ele lê o access_token
 * do cookie httpOnly por conta própria.
 */
export async function resolveFlowAuthToken(): Promise<string | undefined> {
  const store = await cookies();
  if (store.get(ACCESS_TOKEN_COOKIE)?.value) return undefined;
  return store.get(CONFIRM_TOKEN_COOKIE)?.value || undefined;
}
