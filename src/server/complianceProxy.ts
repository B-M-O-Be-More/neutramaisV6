// Proxy BFF → compliance-api (server-only). Mesmo contrato dos demais proxies
// (ADR-002): o browser nunca fala com a compliance-api direto. O Bearer é o
// mesmo access_token do Identity, lido do cookie httpOnly.
//
// Diferente da identity-api, a compliance-api responde JSON cru no sucesso e
// `{"error": {"code", "message", "details"?}}` na falha. O proxy normaliza as
// duas formas para o ResponseEnvelope, para o `api.client` desembrulhar e
// mapear os erros como faz com o Identity.

import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { ApiErrorItem } from "@/types/api.types";

import { ACCESS_TOKEN_COOKIE } from "./authCookies";
import { envelopeError } from "./identityProxy";

const COMPLIANCE_API_URL = process.env.COMPLIANCE_API_URL;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids de path vão para a URL do upstream — só UUIDs passam. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export interface ComplianceForwardOptions {
  method: "GET" | "POST";
  /** Caminho relativo à base da compliance-api, ex.: "/admin/kyc/requests/{id}". */
  path: string;
  /** Body já parseado a ser reenviado como JSON. Omitir quando não houver. */
  body?: unknown;
  /** Headers adicionais a propagar (ex.: Idempotency-Key). */
  headers?: Record<string, string>;
}

interface ComplianceErrorDetail {
  field?: string;
  type?: string;
  rule?: string;
}

interface ComplianceErrorBody {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: ComplianceErrorDetail[];
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// `{error: {code, message, details}}` → ResponseEnvelope. O código de negócio
// vai em `errors[0]` (é dele que `upstreamErrorCode` lê); os itens de validação
// vêm em seguida, com a regra no lugar do código.
function toErrorEnvelope(status: number, text: string): NextResponse {
  const error = (parseJson(text) as ComplianceErrorBody | undefined)?.error;
  const code = typeof error?.code === "string" ? error.code : "upstream_error";
  const message = typeof error?.message === "string" ? error.message : code;

  const errors: ApiErrorItem[] = [
    { field: "_server", code, detail: message },
    ...(Array.isArray(error?.details) ? error.details : []).map((item) => ({
      field: item.field || "_form",
      code: item.rule || item.type || code,
      detail: item.type || "",
    })),
  ];

  return NextResponse.json(
    { message, data: null, errors, metadata: null },
    { status },
  );
}

/**
 * Encaminha uma requisição para a compliance-api com o Bearer do cookie e
 * devolve a resposta no formato ResponseEnvelope, preservando o status.
 */
export async function forwardToCompliance({
  method,
  path,
  body,
  headers,
}: ComplianceForwardOptions): Promise<NextResponse> {
  if (!COMPLIANCE_API_URL) {
    return envelopeError(
      500,
      "COMPLIANCE_API_URL_MISSING",
      "COMPLIANCE_API_URL não configurada no ambiente.",
    );
  }

  const hasBody = body !== undefined && method !== "GET";
  const bearer = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  let upstream: Response;
  try {
    upstream = await fetch(`${COMPLIANCE_API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "X-Request-ID": crypto.randomUUID(),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...headers,
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    return envelopeError(
      502,
      "UPSTREAM_UNAVAILABLE",
      `Falha ao contatar a compliance-api: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const text = await upstream.text();

  if (!upstream.ok) return toErrorEnvelope(upstream.status, text);

  return NextResponse.json(
    {
      message: "",
      data: parseJson(text) ?? null,
      errors: null,
      metadata: null,
    },
    { status: upstream.status },
  );
}

/** Corpo JSON da requisição do browser; `undefined` quando vazio ou inválido. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** 404 no formato do envelope, para ids de path que não são UUID. */
export function invalidIdResponse(): NextResponse {
  return envelopeError(404, "not_found", "Identificador inválido.");
}
