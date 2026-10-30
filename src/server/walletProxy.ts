// Proxy BFF → wallet-api (server-only). Mesmo contrato dos demais proxies
// (ADR-002): o browser nunca fala com a wallet-api direto; os route handlers
// em app/api/wallet/* encaminham a chamada.
//
// A wallet-api responde o objeto puro (sem o ResponseEnvelope) e os erros no
// formato do FastAPI (`{"detail": "..."}`). Em sucesso, o BFF embrulha o corpo
// no envelope para o api.client ler como as outras APIs; erros seguem verbatim
// (o api.client tipa pelo status).

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBaseUrl, missingApiUrlMessage } from "./apiBaseUrl";
import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const WALLET_API_URL = apiBaseUrl("wallet");

/** Moedas da carteira (uma carteira por moeda na organização). */
const WALLET_CURRENCIES = ["BRL", "USD", "EUR"] as const;

export function isWalletCurrency(
  value: string,
): value is (typeof WALLET_CURRENCIES)[number] {
  return (WALLET_CURRENCIES as readonly string[]).includes(value);
}

type QueryValue = string | number | boolean | null | undefined;

export interface WalletForwardOptions {
  /** Caminho relativo à base da wallet-api, ex.: "/wallet/balance". */
  path: string;
  /** Query string a repassar. Valores nulos/vazios são descartados. */
  params?: Record<string, QueryValue>;
}

function buildQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Bearer da wallet-api: a carteira é a da organização do token (`org`). Vale
 * o da sessão de perfil quando há uma (seller); senão, o do login.
 */
async function resolveWalletBearer(): Promise<string | undefined> {
  const store = await cookies();
  return (
    store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value ??
    store.get(ACCESS_TOKEN_COOKIE)?.value
  );
}

/**
 * Encaminha uma leitura autenticada para a wallet-api. Sucesso volta no
 * envelope; erros upstream mantêm corpo e status; falhas de infraestrutura
 * viram envelopes de erro tipados.
 */
export async function forwardToWallet({
  path,
  params,
}: WalletForwardOptions): Promise<NextResponse> {
  if (!WALLET_API_URL) {
    return envelopeError(
      500,
      "WALLET_API_URL_MISSING",
      missingApiUrlMessage("wallet"),
    );
  }

  const bearer = await resolveWalletBearer();

  try {
    const upstream = await fetch(
      `${WALLET_API_URL}${path}${buildQueryString(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Request-ID": crypto.randomUUID(),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        cache: "no-store",
      },
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(correlationId ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
    };
    const text = await upstream.text();

    if (!upstream.ok) {
      return new NextResponse(text, { status: upstream.status, headers });
    }

    return new NextResponse(
      JSON.stringify({
        message: "",
        data: text ? JSON.parse(text) : null,
        errors: null,
        metadata: null,
      }),
      { status: upstream.status, headers },
    );
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a wallet-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
