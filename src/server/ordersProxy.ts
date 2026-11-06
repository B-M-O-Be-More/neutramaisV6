// Proxy BFF → orders-api (server-only). Mesmo contrato dos demais proxies
// (ADR-002): o browser nunca fala com a orders-api direto; os route handlers
// em app/api/orders/* encaminham a chamada.
//
// As listas de pedidos já vêm no envelope da Neutra (`message`, `data`,
// `errors`, `metadata`) e os erros no formato do FastAPI (`{"detail": ...}`):
// o BFF repassa corpo e status (o api.client tipa pelo status).

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBaseUrl, missingApiUrlMessage } from "./apiBaseUrl";
import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const ORDERS_API_URL = apiBaseUrl("orders");

type QueryValue = string | number | boolean | null | undefined;

export interface OrdersForwardOptions {
  /** Caminho relativo à base da orders-api, ex.: "/productOrder/seller". */
  path: string;
  /** Método HTTP; o padrão é GET. As ações (aceite, NF, rastreio) usam POST. */
  method?: "GET" | "POST";
  /** Query string a repassar. Valores nulos/vazios são descartados. */
  params?: Record<string, QueryValue>;
  /** Corpo JSON (NF, rastreio). Só os campos do contrato: filtre antes. */
  body?: Record<string, unknown>;
  /**
   * Resposta de sucesso em bytes (PDF da nota fiscal): repassa o corpo sem
   * ler como texto, com o nome do arquivo e sem cache.
   */
  binary?: boolean;
  /**
   * Headers extras do contrato, ex.: `Idempotency-Key` no checkout. O BFF
   * repassa só os que a rota escolheu; nunca os do browser em bloco.
   */
  headers?: Record<string, string>;
}

/**
 * A orders-api manda alguns códigos só no header `X-Error-Code` (ex.:
 * `MFA_REQUIRED` no 403 do checkout), com o corpo `{"detail": ...}` sem
 * `code`. O BFF copia o código para a raiz do corpo JSON, onde o
 * `upstreamErrorCode` do front lê; o corpo que já tem `code` fica como está.
 */
export function withHeaderErrorCode(
  status: number,
  text: string,
  headerCode: string | null,
): string {
  if (status < 400 || !headerCode) return text;
  try {
    const body = JSON.parse(text) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return text;
    if ((body as { code?: unknown }).code) return text;
    return JSON.stringify({ ...body, code: headerCode });
  } catch {
    return text;
  }
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
 * Bearer da orders-api: o da sessão de perfil (POST /auth/context). A API
 * compara o `org` do token com o Buyer e o Seller do pedido e lê só as
 * `permissions` do perfil — Seller em /seller/orders. Sem perfil
 * selecionado, vale o do login.
 */
async function resolveOrdersBearer(): Promise<string | undefined> {
  const store = await cookies();
  return (
    store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value ??
    store.get(ACCESS_TOKEN_COOKIE)?.value
  );
}

// O upstream aceita offset de 0 a 10000 e limit de 1 a 200.
const OFFSET_PATTERN = /^(10000|\d{1,4})$/;
const LIMIT_PATTERN = /^(200|1\d{2}|[1-9]\d?)$/;

/**
 * Lista paginada de pedidos (Buyer ou Seller): confere `offset` e `limit`
 * antes de chamar a orders-api e repassa o envelope.
 */
export async function forwardOrdersList(
  searchParams: URLSearchParams,
  path: "/productOrder/buyer" | "/productOrder/seller",
): Promise<NextResponse> {
  const offset = searchParams.get("offset");
  const limit = searchParams.get("limit");

  if (
    (offset !== null && !OFFSET_PATTERN.test(offset)) ||
    (limit !== null && !LIMIT_PATTERN.test(limit))
  ) {
    return envelopeError(
      422,
      "validation_error",
      "Use offset de 0 a 10000 e limit de 1 a 200.",
    );
  }

  return forwardToOrders({ path, params: { offset, limit } });
}

/**
 * Encaminha uma chamada autenticada para a orders-api e devolve a resposta
 * upstream sem alterar. Falhas de infraestrutura viram envelopes de erro
 * tipados. O `X-Correlation-ID` da resposta segue para o browser.
 */
export async function forwardToOrders({
  path,
  method = "GET",
  params,
  body,
  binary = false,
  headers,
}: OrdersForwardOptions): Promise<NextResponse> {
  if (!ORDERS_API_URL) {
    return envelopeError(
      500,
      "ORDERS_API_URL_MISSING",
      missingApiUrlMessage("orders"),
    );
  }

  const bearer = await resolveOrdersBearer();

  try {
    const upstream = await fetch(
      `${ORDERS_API_URL}${path}${buildQueryString(params)}`,
      {
        method,
        headers: {
          Accept: binary ? "*/*" : "application/json",
          [CORRELATION_ID_HEADER]: crypto.randomUUID(),
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      },
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const correlation: Record<string, string> = correlationId
      ? { [CORRELATION_ID_HEADER]: correlationId }
      : {};

    if (binary && upstream.ok) {
      const disposition = upstream.headers.get("Content-Disposition");
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ?? "application/octet-stream",
          ...(disposition ? { "Content-Disposition": disposition } : {}),
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
          ...correlation,
        },
      });
    }

    const text = withHeaderErrorCode(
      upstream.status,
      await upstream.text(),
      upstream.headers.get("X-Error-Code"),
    );
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        ...correlation,
      },
    });
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a orders-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
