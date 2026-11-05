// Proxy BFF → contracts-api (server-only). Mesmo contrato dos demais proxies
// (ADR-002): o browser nunca fala com a contracts-api direto; os route
// handlers em app/api/contracts/* encaminham a chamada.
//
// As rotas `/order-contracts` respondem o objeto cru, sem envelope: o BFF
// embrulha o sucesso em `{message, data, metadata}` para o api.client
// desembrulhar como nas outras APIs. Os erros vêm no formato do FastAPI
// (`{"detail": ...}`) e seguem como estão (o api.client tipa pelo status).

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBaseUrl, missingApiUrlMessage } from "./apiBaseUrl";
import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const CONTRACTS_API_URL = apiBaseUrl("contracts");

type QueryValue = string | number | boolean | null | undefined;

export interface ContractsForwardOptions {
  /** Caminho relativo à base da contracts-api, ex.: "/order-contracts". */
  path: string;
  /** Método HTTP; o padrão é GET. A assinatura (sem corpo) usa POST. */
  method?: "GET" | "POST";
  /** Query string a repassar. Valores nulos/vazios são descartados. */
  params?: Record<string, QueryValue>;
  /**
   * Resposta de sucesso em bytes (PDF do contrato): repassa o corpo sem ler
   * como texto, com o ETag (SHA-256 do arquivo) e sem cache.
   */
  binary?: boolean;
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
 * Bearer da contracts-api: o da sessão de perfil (POST /auth/context). A API
 * compara o `org` do token com o Buyer e o Seller do contrato e lê só as
 * `permissions` (`contract:read`, `contract:sign`). Sem perfil selecionado,
 * vale o do login.
 */
async function resolveContractsBearer(): Promise<string | undefined> {
  const store = await cookies();
  return (
    store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value ??
    store.get(ACCESS_TOKEN_COOKIE)?.value
  );
}

const isJson = (contentType: string | null) =>
  !!contentType && contentType.includes("application/json");

/**
 * Encaminha uma chamada autenticada para a contracts-api. Falhas de
 * infraestrutura viram envelopes de erro tipados. O `X-Correlation-ID` da
 * resposta segue para o browser.
 */
export async function forwardToContracts({
  path,
  method = "GET",
  params,
  binary = false,
}: ContractsForwardOptions): Promise<NextResponse> {
  if (!CONTRACTS_API_URL) {
    return envelopeError(
      500,
      "CONTRACTS_API_URL_MISSING",
      missingApiUrlMessage("contracts"),
    );
  }

  const bearer = await resolveContractsBearer();

  try {
    const upstream = await fetch(
      `${CONTRACTS_API_URL}${path}${buildQueryString(params)}`,
      {
        method,
        headers: {
          Accept: binary ? "*/*" : "application/json",
          [CORRELATION_ID_HEADER]: crypto.randomUUID(),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        cache: "no-store",
      },
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const correlation: Record<string, string> = correlationId
      ? { [CORRELATION_ID_HEADER]: correlationId }
      : {};
    const contentType = upstream.headers.get("Content-Type");

    if (binary && upstream.ok) {
      const etag = upstream.headers.get("ETag");
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": contentType ?? "application/pdf",
          "Content-Disposition": 'attachment; filename="contract.pdf"',
          ...(etag ? { ETag: etag } : {}),
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
          ...correlation,
        },
      });
    }

    // Erro sem JSON não tem `detail` para o front ler. 5xx em texto é falha
    // interna da API (o FastAPI responde "Internal Server Error"); 4xx em
    // HTML é o gateway recusando o caminho (o nginx da homologação).
    if (!upstream.ok && !isJson(contentType)) {
      const isServerError = upstream.status >= 500;
      return envelopeError(
        isServerError ? 502 : 503,
        isServerError ? "CONTRACTS_API_ERROR" : "CONTRACTS_API_UNAVAILABLE",
        isServerError
          ? `A contracts-api falhou ao responder (HTTP ${upstream.status}).`
          : `O gateway recusou a chamada à contracts-api (HTTP ${upstream.status}).`,
      );
    }

    const text = await upstream.text();
    return new NextResponse(
      upstream.ok
        ? `{"message":"ok","data":${text || "null"},"metadata":{}}`
        : text,
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...correlation },
      },
    );
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a contracts-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
