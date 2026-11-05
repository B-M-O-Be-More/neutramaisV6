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
  /** Padrão GET. */
  method?: "GET" | "POST";
  /** Corpo JSON (só no POST). */
  body?: unknown;
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
 * A payment-api recusa token vencido ou inválido com 403 ("Invalid token:
 * …", "Missing Authorization header"), sem `code` — o mesmo status da
 * falta de papel. Vira 401 para o front renovar a sessão e repetir; 403 com
 * `code` (ex.: `mfa_required`) segue 403.
 */
function isExpiredTokenRefusal(status: number, text: string): boolean {
  if (status !== 403) return false;
  try {
    const body = JSON.parse(text) as { message?: unknown; code?: unknown };
    return (
      !body.code &&
      typeof body.message === "string" &&
      /^(Invalid token|Missing Authorization header)/.test(body.message)
    );
  } catch {
    return false;
  }
}

/**
 * Encaminha uma chamada autenticada para a payment-api e devolve a resposta
 * upstream sem alterar. Falhas de infraestrutura viram envelopes de erro
 * tipados. O `X-Correlation-ID` da resposta segue para o browser.
 */
export async function forwardToPayment({
  path,
  params,
  method = "GET",
  body,
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
        method,
        headers: {
          Accept: "application/json",
          [CORRELATION_ID_HEADER]: crypto.randomUUID(),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      },
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: isExpiredTokenRefusal(upstream.status, text)
        ? 401
        : upstream.status,
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
