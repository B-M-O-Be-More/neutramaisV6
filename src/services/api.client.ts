// Cliente HTTP — wrapper leve sobre `fetch` (SDD §12.1).
// Padroniza base URL, headers, timeout, X-Request-ID, unwrap do ResponseEnvelope e
// mapeamento de erros. Isomórfico: `createApiClient` serve tanto ao browser (base `/api`,
// via BFF) quanto aos route handlers server-side (base = identity-api, com Authorization).

import type { PaginationMetadata, ResponseEnvelope } from "@/types/api.types";
import { NetworkError, TimeoutError, apiErrorFromResponse } from "./errors";

const DEFAULT_TIMEOUT_MS = 30_000;

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export interface RequestOptions {
  params?: QueryParams;
  headers?: Record<string, string>;
  /** Sinal externo de cancelamento; combinado com o timeout interno. */
  signal?: AbortSignal;
  /** Timeout em ms (default 30s). */
  timeoutMs?: number;
}

/** Resultado bruto de uma request: dado desembrulhado + metadados do envelope. */
export interface ApiResult<T> {
  data: T;
  message: string;
  metadata: PaginationMetadata | null;
}

export interface ApiClientConfig {
  /** Base URL. Browser: "/api". Server: URL da identity-api. */
  baseUrl: string;
  /** Headers de auth injetados por request (ex.: Bearer no server-side). */
  getAuthHeaders?: () =>
    | Record<string, string>
    | Promise<Record<string, string>>;
  /** Callback disparado em 401 (ex.: logout + redirect no browser). */
  onUnauthorized?: () => void;
  /** Política de cookies. Browser same-origin usa "same-origin". */
  credentials?: RequestCredentials;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
// Aceita DTOs tipados (interfaces), arrays, FormData ou null. `object` cobre
// interfaces sem index signature; FormData é tratado à parte antes do stringify.
type Body = object | null;

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID.
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value
        .filter((v) => v !== null && v !== undefined)
        .forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getAuthHeaders, onUnauthorized, credentials } = config;

  async function request<T>(
    method: Method,
    path: string,
    body?: Body,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const { params, headers: extraHeaders, signal, timeoutMs } = options;

    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Request-ID": generateRequestId(),
      ...(isFormData
        ? {}
        : body != null
          ? { "Content-Type": "application/json" }
          : {}),
      ...(getAuthHeaders ? await getAuthHeaders() : {}),
      ...(extraHeaders || {}),
    };

    // Timeout via AbortController, combinado com um signal externo opcional.
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new DOMException("Timeout", "TimeoutError")),
      timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (signal) {
      if (signal.aborted) controller.abort(signal.reason);
      else
        signal.addEventListener(
          "abort",
          () => controller.abort(signal.reason),
          { once: true },
        );
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: credentials ?? "same-origin",
      signal: controller.signal,
    };
    if (body != null && method !== "GET") {
      init.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    const url = `${baseUrl}${path}${buildQueryString(params)}`;

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (controller.signal.aborted && !signal?.aborted) {
        throw new TimeoutError("A requisição expirou.", { cause: error });
      }
      throw new NetworkError("Falha de conexão com o servidor.", {
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    // 204 No Content (logout/revoke) — sem envelope.
    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      if (!response.ok) throw apiErrorFromResponse(response.status);
      return { data: undefined as T, message: "", metadata: null };
    }

    let envelope: ResponseEnvelope<T> | null = null;
    try {
      envelope = (await response.json()) as ResponseEnvelope<T>;
    } catch {
      // Corpo não-JSON ou vazio.
      if (!response.ok) throw apiErrorFromResponse(response.status);
      return { data: undefined as T, message: "", metadata: null };
    }

    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.();
      throw apiErrorFromResponse(
        response.status,
        envelope?.errors ?? [],
        envelope?.message,
        envelope,
      );
    }

    return {
      data: envelope?.data as T,
      message: envelope?.message ?? "",
      metadata: envelope?.metadata ?? null,
    };
  }

  return {
    request,
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, null, options).then((r) => r.data),
    post: <T>(path: string, body?: Body, options?: RequestOptions) =>
      request<T>("POST", path, body ?? null, options).then((r) => r.data),
    put: <T>(path: string, body?: Body, options?: RequestOptions) =>
      request<T>("PUT", path, body ?? null, options).then((r) => r.data),
    patch: <T>(path: string, body?: Body, options?: RequestOptions) =>
      request<T>("PATCH", path, body ?? null, options).then((r) => r.data),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, null, options).then((r) => r.data),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Instância padrão do browser. Fala sempre com o BFF same-origin (`/api/*`),
 * que faz proxy pra identity-api e gerencia os cookies httpOnly (ADR-002).
 * Cookies vão automaticamente (same-origin); o browser nunca injeta Bearer.
 */
export const api = createApiClient({
  baseUrl: "/api",
  credentials: "same-origin",
});
