// Tipos crus do envelope da API (identity-api / neutramais-commons `ResponseEnvelope`).
// Toda rota que retorna body usa este formato. Rotas 204 (logout/revoke) não retornam envelope.

/** Item de erro estruturado retornado no array `errors` do envelope. */
export interface ApiErrorItem {
  field: string;
  code: string;
  detail: string;
}

/** Metadados de paginação (envelope-level), presentes em respostas paginadas. */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Envelope padrão de resposta. Em sucesso, `errors` vem `null` e o conteúdo em `data`.
 * Em erro, `data` vem `null` e os detalhes em `errors`.
 */
export interface ResponseEnvelope<T> {
  message: string;
  data: T | null;
  errors: ApiErrorItem[] | null;
  metadata: PaginationMetadata | null;
}
