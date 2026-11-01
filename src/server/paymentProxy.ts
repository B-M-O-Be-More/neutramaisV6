// Proxy BFF → payment-api (server-only). Mesmo contrato dos demais proxies
// (ADR-002): o browser nunca fala com a payment-api direto; os route
// handlers em app/api/payment/* encaminham a chamada.
//
// As rotas de repasse e de custo de frete respondem `{"data": [...]}` (sem
// `message`) e os erros no formato do FastAPI (`{"detail": ...}`): o BFF
// repassa corpo e status — o api.client desembrulha o `data` e tipa os erros
// pelo status.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBaseUrl, missingApiUrlMessage } from "./apiBaseUrl";
import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const PAYMENT_API_URL = apiBaseUrl("payment");

type QueryValue = string | number | boolean | null | undefined;

export interface PaymentForwardOptions {
  /** Caminho relativo à base da payment-api, ex.: "/payment/seller/receivables". */
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
 * Bearer da payment-api: o da sessão de perfil (POST /auth/context) — a API
 * filtra pela organização do token e confere as `permissions` do perfil
 * (Seller em /seller/wallet). Sem perfil selecionado, vale o do login.
 */
async function resolvePaymentBearer(): Promise<string | undefined> {
  const store = await cookies();
  return (
    store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value ??
    store.get(ACCESS_TOKEN_COOKIE)?.value
  );
}

/**
 * Encaminha uma leitura autenticada para a payment-api e devolve a resposta
 * upstream sem alterar. Falhas de infraestrutura viram envelopes de erro
 * tipados. O `X-Correlation-ID` da resposta segue para o browser.
 */
export async function forwardToPayment({
  path,
  params,
}: PaymentForwardOptions): Promise<NextResponse> {
  if (!PAYMENT_API_URL) {
    return envelopeError(
      500,
      "PAYMENT_API_URL_MISSING",
      missingApiUrlMessage("payment"),
    );
  }

  const bearer = await resolvePaymentBearer();

  try {
    const upstream = await fetch(
      `${PAYMENT_API_URL}${path}${buildQueryString(params)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          [CORRELATION_ID_HEADER]: crypto.randomUUID(),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        cache: "no-store",
      },
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        ...(correlationId ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
      },
    });
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a payment-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
