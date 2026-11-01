// Proxy BFF → marketplace-api (server-only). Mesmo contrato do identityProxy
// (ADR-002): o browser nunca fala com a marketplace-api direto; os route
// handlers em app/api/* encaminham a chamada preservando o ResponseEnvelope e o
// status upstream verbatim.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiBaseUrl, missingApiUrlMessage } from "./apiBaseUrl";
import {
  ACCESS_TOKEN_COOKIE,
  PROFILE_ACCESS_TOKEN_COOKIE,
} from "./authCookies";
import { CORRELATION_ID_HEADER, envelopeError } from "./identityProxy";

const MARKETPLACE_API_URL = apiBaseUrl("marketplace");

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
  /**
   * Envia o token da sessão de perfil (Seller), com o do login como reserva:
   * rotas em que a marketplace-api confere o contexto do perfil (ex.: editar
   * a oferta). Implica `authenticated`.
   */
  profileSession?: boolean;
}

async function resolveMarketplaceBearer(
  authenticated: boolean,
  profileSession: boolean,
): Promise<string | undefined> {
  if (!authenticated && !profileSession) return undefined;
  const store = await cookies();
  return (
    (profileSession
      ? store.get(PROFILE_ACCESS_TOKEN_COOKIE)?.value
      : undefined) ?? store.get(ACCESS_TOKEN_COOKIE)?.value
  );
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
  profileSession = false,
}: MarketplaceForwardOptions): Promise<NextResponse> {
  if (!MARKETPLACE_API_URL) {
    return envelopeError(
      500,
      "MARKETPLACE_API_URL_MISSING",
      missingApiUrlMessage("marketplace"),
    );
  }

  const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
  const bearer = await resolveMarketplaceBearer(authenticated, profileSession);

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

    // O suporte rastreia a chamada pelo X-Correlation-ID.
    const correlationId = upstream.headers.get(CORRELATION_ID_HEADER);
    const correlation: Record<string, string> = correlationId
      ? { [CORRELATION_ID_HEADER]: correlationId }
      : {};

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204, headers: correlation });
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
      `Falha ao contatar a marketplace-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Copia do corpo só os campos do contrato — a marketplace-api ignora campos
 * desconhecidos na maioria das rotas, mas o BFF não repassa nada além do
 * esperado. Corpo que não é objeto vira `{}` (o upstream responde 422).
 */
export function pickBody(
  body: unknown,
  allowed: readonly string[],
): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const source = body as Record<string, unknown>;
  return Object.fromEntries(
    allowed.filter((key) => key in source).map((key) => [key, source[key]]),
  );
}
