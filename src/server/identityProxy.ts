// Proxy BFF → identity-api (server-only). ADR-002: o browser nunca fala com a
// identity-api direto; os route handlers em app/api/* encaminham a chamada,
// preservando o ResponseEnvelope e o status upstream verbatim, e anexam o Bearer
// lido do cookie httpOnly (access_token) — ou do `authToken` explícito.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "./authCookies";

const IDENTITY_API_URL = process.env.IDENTITY_API_URL;

export interface ForwardOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Caminho relativo à base da identity-api, ex.: "/organizations/register". */
  path: string;
  /** Body já parseado a ser reenviado como JSON. Omitir em GET/DELETE. */
  body?: unknown;
  /** Bearer explícito. Se omitido, usa o access_token do cookie (quando houver). */
  authToken?: string;
  /** Headers adicionais a propagar. */
  headers?: Record<string, string>;
}

/** Erro de infraestrutura (config ausente / upstream inacessível). */
export interface IdentityInfraError {
  status: number;
  code: string;
  detail: string;
}

/** Resultado cru de uma chamada à identity-api. */
export interface IdentityCallResult {
  ok: boolean;
  status: number;
  text: string;
  contentType: string;
  /** Presente quando a chamada falhou por infraestrutura (não chegou ao upstream). */
  infraError?: IdentityInfraError;
}

export function envelopeError(
  status: number,
  code: string,
  detail: string,
): NextResponse {
  return NextResponse.json(
    {
      message: detail,
      data: null,
      errors: [{ field: "_server", code, detail }],
      metadata: null,
    },
    { status },
  );
}

// Bearer explícito tem prioridade; senão, lê o access_token do cookie httpOnly.
async function resolveBearer(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Chama a identity-api e devolve o resultado cru (status + corpo em texto).
 * Não constrói NextResponse — permite ao chamador ler o corpo (ex.: extrair
 * tokens no login) antes de responder. Erros de infraestrutura vêm em `infraError`.
 */
export async function callIdentity({
  method,
  path,
  body,
  authToken,
  headers,
}: ForwardOptions): Promise<IdentityCallResult> {
  if (!IDENTITY_API_URL) {
    return {
      ok: false,
      status: 500,
      text: "",
      contentType: "application/json",
      infraError: {
        status: 500,
        code: "IDENTITY_API_URL_MISSING",
        detail: "IDENTITY_API_URL não configurada no ambiente.",
      },
    };
  }

  const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
  const bearer = await resolveBearer(authToken);

  const upstreamHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Request-ID": crypto.randomUUID(),
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    ...headers,
  };

  try {
    const upstream = await fetch(`${IDENTITY_API_URL}${path}`, {
      method,
      headers: upstreamHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return {
      ok: upstream.ok,
      status: upstream.status,
      text: await upstream.text(),
      contentType: upstream.headers.get("Content-Type") ?? "application/json",
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      text: "",
      contentType: "application/json",
      infraError: {
        status: 502,
        code: "UPSTREAM_UNAVAILABLE",
        detail: `Falha ao contatar a identity-api: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
    };
  }
}

/**
 * Encaminha uma requisição para a identity-api e devolve a resposta upstream
 * (corpo + status) sem alterar o envelope. Erros de infraestrutura viram
 * envelopes de erro tipados.
 */
export async function forwardToIdentity(
  options: ForwardOptions,
): Promise<NextResponse> {
  const result = await callIdentity(options);

  if (result.infraError) {
    return envelopeError(
      result.infraError.status,
      result.infraError.code,
      result.infraError.detail,
    );
  }

  // 204 (logout/revoke) — sem corpo.
  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(result.text, {
    status: result.status,
    headers: { "Content-Type": result.contentType },
  });
}
