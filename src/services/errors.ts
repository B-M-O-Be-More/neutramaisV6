// Hierarquia de erros tipados da camada de rede (SDD §12.4).
// Regra: erros são tratados na camada de hook de feature, não no componente.
// O 401 idealmente nunca chega ao componente — o BFF/refresh já resolveu ou fez logout.

import type { ApiErrorItem } from "@/types/api.types";

/** Base de todos os erros da aplicação. */
export class AppError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    // Preserva o nome da subclasse concreta (ex.: "ValidationError").
    this.name = new.target.name;
  }
}

/** Falha de rede — sem conexão, DNS, CORS, etc. Nenhuma resposta HTTP recebida. */
export class NetworkError extends AppError {}

/** Request expirou (timeout do AbortController). */
export class TimeoutError extends AppError {}

/** Erro com resposta HTTP do servidor. Carrega status e os `errors[]` do envelope. */
export class ApiError extends AppError {
  constructor(
    public readonly status: number,
    public readonly errors: ApiErrorItem[] = [],
    message?: string,
    public readonly payload?: unknown,
  ) {
    super(message || `Erro da API (HTTP ${status})`);
  }
}

/** 401 — credencial inválida ou sessão expirada. */
export class AuthError extends ApiError {}

/** 403 — autenticado mas sem permissão. */
export class ForbiddenError extends ApiError {}

/** 404 — recurso inexistente. */
export class NotFoundError extends ApiError {}

/** 409 — conflito (ex.: organização já cadastrada). */
export class ConflictError extends ApiError {}

/** 422 — validação. Expõe os erros agrupados por campo para o formulário. */
export class ValidationError extends ApiError {
  /** Mapa `campo -> [mensagens]`, pronto para RHF `setError`. */
  get fields(): Record<string, string[]> {
    return this.errors.reduce<Record<string, string[]>>((acc, item) => {
      const key = item.field || "_form";
      (acc[key] ??= []).push(item.detail || item.code);
      return acc;
    }, {});
  }
}

/** 429 — rate-limit (pode exigir captcha no fluxo de login). */
export class RateLimitError extends ApiError {}

/** 5xx — erro interno do servidor. */
export class ServerError extends ApiError {}

/**
 * Código de erro de negócio publicado pelo upstream. A identity-api coloca esse
 * código em `metadata.code` (ex.: `INVALID_CREDENTIALS`) e NÃO usa sempre o
 * status HTTP correspondente — credenciais inválidas no login chegam como 500,
 * não 401. Por isso o código é uma âncora mais confiável que o status para
 * decidir a mensagem exibida.
 *
 * Retorna `undefined` quando a resposta não traz código (caso comum nos 422).
 */
export function upstreamErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;

  // Preferimos o `errors[]` do envelope quando existir; senão, metadata.code.
  const fromErrors = error.errors[0]?.code;
  if (fromErrors) return fromErrors;

  const metadata = (error.payload as { metadata?: { code?: unknown } } | null)
    ?.metadata;
  return typeof metadata?.code === "string" ? metadata.code : undefined;
}

/**
 * Violações de política de senha devolvidas pelo upstream em
 * `metadata.detail.violations` (ex.: `["missing_uppercase", "missing_digit"]`).
 *
 * Vale ler daqui em vez de confiar no status: a identity-api responde essa
 * violação fora do 422 e com `errors: null`, então o `ValidationError.fields`
 * não a captura.
 */
export function upstreamPasswordViolations(
  error: unknown,
): string[] | undefined {
  if (!(error instanceof ApiError)) return undefined;

  const detail = (
    error.payload as { metadata?: { detail?: { violations?: unknown } } } | null
  )?.metadata?.detail?.violations;

  if (!Array.isArray(detail)) return undefined;
  const violations = detail.filter(
    (item): item is string => typeof item === "string",
  );
  return violations.length ? violations : undefined;
}

/** Item de erro de validação cru do FastAPI (`{"detail": [...]}`). */
interface FastApiDetailItem {
  loc?: unknown[];
  msg?: string;
  type?: string;
}

/**
 * Mensagem legível a partir de um 422 cru do FastAPI. Alguns endpoints da
 * identity-api respondem `{"detail": [{loc, msg, type}]}` em vez do
 * ResponseEnvelope, então `ValidationError.fields` vem vazio — este helper
 * recupera algo exibível nesses casos.
 */
export function upstreamDetailMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;

  const detail = (error.payload as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return undefined;

  const messages = (detail as FastApiDetailItem[])
    .map((item) => {
      if (!item?.msg) return undefined;
      // `loc` costuma ser ["body", "<campo>"] — o campo ajuda a situar o erro.
      const field = Array.isArray(item.loc)
        ? item.loc.filter((part) => part !== "body").join(".")
        : "";
      return field ? `${field}: ${item.msg}` : item.msg;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length ? messages.join("; ") : undefined;
}

/**
 * Constrói o erro tipado correto a partir do status HTTP e do envelope de resposta.
 * `errors` e `message` são extraídos do envelope quando presentes.
 */
export function apiErrorFromResponse(
  status: number,
  errors: ApiErrorItem[] = [],
  message?: string,
  payload?: unknown,
): ApiError {
  switch (status) {
    case 401:
      return new AuthError(status, errors, message, payload);
    case 403:
      return new ForbiddenError(status, errors, message, payload);
    case 404:
      return new NotFoundError(status, errors, message, payload);
    case 409:
      return new ConflictError(status, errors, message, payload);
    case 422:
      return new ValidationError(status, errors, message, payload);
    case 429:
      return new RateLimitError(status, errors, message, payload);
    default:
      if (status >= 500)
        return new ServerError(status, errors, message, payload);
      return new ApiError(status, errors, message, payload);
  }
}
