import { NextRequest, NextResponse } from "next/server";

import {
  clearAuthCookies,
  clearEmailConfirmationCookies,
  setAuthCookies,
  setEmailConfirmationCookies,
} from "@/server/authCookies";
import { callIdentity, envelopeError } from "@/server/identityProxy";

// BFF: GET /api/auth/confirm-email → identity-api GET /auth/confirm-email
// Rota pública. Repassa token + user_id (query) para o upstream.
//
// Em 2xx a rota também reseta os cookies do browser: derruba qualquer sessão
// anterior (o link do e-mail costuma abrir num navegador que já tem uma) e grava
// no lugar o contexto da confirmação — `token` e `user_id` do link. Fora do 2xx
// nada é tocado além da limpeza do contexto antigo.
//
// Se o upstream devolver um par de tokens na confirmação, ele vale mais que o
// contexto: vira sessão de fato (ADR-002, cookies httpOnly) e as rotas
// autenticadas do KYC passam a ter Bearer sem mais nada. Enquanto não devolver,
// sobra o `token` do link — ver o fallback em /kyc/artifacts.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = request.nextUrl.searchParams.get("user_id") ?? "";
  const query = new URLSearchParams({ token, user_id: userId }).toString();

  const result = await callIdentity({
    method: "GET",
    path: `/auth/confirm-email?${query}`,
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
    // Corpo não-JSON: repassa verbatim, sem tentar extrair sessão.
  }

  const session = envelope?.data;
  const hasSession = Boolean(
    result.ok && session?.access_token && session?.refresh_token,
  );

  // Com sessão, os tokens saem do corpo (nunca chegam ao JS do browser).
  const response = hasSession
    ? NextResponse.json(
        {
          ...envelope,
          data: (() => {
            const { access_token, refresh_token, ...safe } = session!;
            void access_token;
            void refresh_token;
            return safe;
          })(),
        },
        { status: result.status },
      )
    : new NextResponse(result.text, {
        status: result.status,
        headers: { "Content-Type": result.contentType },
      });

  // Estado antigo cai nos dois casos — o que muda é o que entra no lugar.
  clearAuthCookies(response);

  if (hasSession) {
    setAuthCookies(
      response,
      {
        accessToken: session!.access_token as string,
        refreshToken: session!.refresh_token as string,
      },
      false,
    );
  }

  if (result.ok && token && userId) {
    setEmailConfirmationCookies(response, { token, userId });
  } else {
    clearEmailConfirmationCookies(response);
  }

  return response;
}
