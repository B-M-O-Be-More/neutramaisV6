// Proxy BFF → geo-api (server-only). Mesmo contrato do marketplaceProxy
// (ADR-002): o browser nunca fala com a geo-api direto; os route handlers em
// app/api/geo/* encaminham a chamada preservando corpo e status upstream.
//
// A geo-api responde erros de validação no formato do FastAPI
// (`{"detail": "..."}`), não no envelope — o api.client tipa pelo status.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Agent } from "undici";

import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const GEO_API_URL = process.env.GEO_API_URL;

// O fetch do Node desiste após 300 s sem resposta. A importação de um KMZ
// grande leva minutos (o "KMZ Geral" do benchmark da geo-api: ~4 min) — este
// agente espera o mesmo que o gateway da geo-api (900 s).
const LONG_REQUEST_MS = 900_000;
const longRequestAgent = new Agent({
  headersTimeout: LONG_REQUEST_MS,
  bodyTimeout: LONG_REQUEST_MS,
});

type QueryValue = string | number | boolean | null | undefined;

export interface GeoForwardOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Caminho relativo à base da geo-api, ex.: "/geo/coverageVersion/kmz". */
  path: string;
  /** Query string a repassar. Valores nulos/vazios são descartados. */
  params?: Record<string, QueryValue>;
  /** JSON já parseado ou `FormData` (upload de KMZ). Omitir em GET/DELETE. */
  body?: unknown;
  /** Espera até 900 s pela geo-api (importação de KMZ grande). */
  long?: boolean;
  /**
   * Resposta de sucesso em bytes (download do KMZ original): repassa o corpo
   * sem ler como texto, com o nome do arquivo e sem cache.
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
 * Bearer da geo-api: o da sessão de perfil (POST /auth/context), que é o que
 * ela autoriza para o seller — o token do login, mesmo de um seller_owner,
 * não substitui a seleção do perfil. Sem perfil selecionado (ex.: equipe da
 * plataforma lendo cotas), vale o token do login.
 */
async function resolveGeoBearer(): Promise<string | undefined> {
  const store = await cookies();
  return (
    store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value ??
    store.get(ACCESS_TOKEN_COOKIE)?.value
  );
}

/**
 * Encaminha uma requisição autenticada (Bearer do cookie httpOnly) para a
 * geo-api e devolve a resposta upstream sem alterar. Erros de infraestrutura
 * viram envelopes de erro tipados. O `X-Correlation-ID` da resposta segue
 * para o browser (o suporte rastreia a chamada por ele).
 */
export async function forwardToGeo({
  method,
  path,
  params,
  body,
  long = false,
  binary = false,
}: GeoForwardOptions): Promise<NextResponse> {
  if (!GEO_API_URL) {
    return envelopeError(
      500,
      "GEO_API_URL_MISSING",
      "GEO_API_URL não configurada no ambiente.",
    );
  }

  const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
  const isFormData = body instanceof FormData;
  const bearer = await resolveGeoBearer();

  try {
    const upstream = await fetch(
      `${GEO_API_URL}${path}${buildQueryString(params)}`,
      {
        method,
        headers: {
          Accept: binary ? "*/*" : "application/json",
          "X-Request-ID": crypto.randomUUID(),
          // Com FormData o fetch define o boundary do multipart sozinho.
          ...(hasBody && !isFormData
            ? { "Content-Type": "application/json" }
            : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: hasBody
          ? isFormData
            ? (body as FormData)
            : JSON.stringify(body)
          : undefined,
        cache: "no-store",
        // `dispatcher` é do fetch do Node (undici), fora do RequestInit.
        ...(long ? { dispatcher: longRequestAgent } : {}),
      } as RequestInit,
    );

    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const correlation: Record<string, string> = correlationId
      ? { [CORRELATION_ID_HEADER]: correlationId }
      : {};

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204, headers: correlation });
    }

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

    return new NextResponse(await upstream.text(), {
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
      `Falha ao contatar a geo-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
