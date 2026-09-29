// Proxy BFF → marketplace-api (server-only). Mesmo contrato do identityProxy
// (ADR-002): o browser nunca fala com a marketplace-api direto; os route
// handlers em app/api/* encaminham a chamada preservando o ResponseEnvelope e o
// status upstream verbatim.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "./authCookies";
import { envelopeError } from "./identityProxy";

const MARKETPLACE_API_URL = process.env.MARKETPLACE_API_URL;

type QueryValue = string | number | boolean | null | undefined;

export interface MarketplaceForwardOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Caminho relativo à base da marketplace-api, ex.: "/productCatalog/catalog". */
  path: string;
  /** Query string a repassar. Valores nulos/vazios são descartados. */
  params?: Record<string, QueryValue>;
  /** Body já parseado a ser reenviado como JSON. Omitir em GET/DELETE. */
  body?: unknown;
  /**
   * Anexa o Bearer do cookie httpOnly (access_token). Rotas públicas (ex.:
   * busca de ofertas) não enviam token — assim uma sessão expirada não
   * derruba uma consulta que não exige autenticação.
   */
  authenticated?: boolean;
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
 * Encaminha uma requisição para a marketplace-api e devolve a resposta upstream
 * (corpo + status) sem alterar o envelope. Erros de infraestrutura viram
 * envelopes de erro tipados.
 */
export async function forwardToMarketplace({
  method,
  path,
  params,
  body,
  authenticated = false,
}: MarketplaceForwardOptions): Promise<NextResponse> {
  if (!MARKETPLACE_API_URL) {
    return envelopeError(
      500,
      "MARKETPLACE_API_URL_MISSING",
      "MARKETPLACE_API_URL não configurada no ambiente.",
    );
  }

  const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
  const bearer = authenticated
    ? (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
    : undefined;

  try {
    const upstream = await fetch(
      `${MARKETPLACE_API_URL}${path}${buildQueryString(params)}`,
      {
        method,
        headers: {
          Accept: "application/json",
          "X-Request-ID": crypto.randomUUID(),
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: hasBody ? JSON.stringify(body) : undefined,
        cache: "no-store",
      },
    );

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a marketplace-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
