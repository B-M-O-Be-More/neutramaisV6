// Service da sessão de perfil (identity-api `/auth/context`).
// O login não basta para a geo-api: o usuário seleciona o perfil (seller) e
// recebe um par de tokens próprio, que o BFF guarda em cookies httpOnly
// separados e passa a usar na geo-api. O browser nunca vê os tokens.
//
// Só `profile` vai na seleção: papel, organização e permissões a identity-api
// tira do cadastro e da sessão autenticada — nunca do browser.

import { api } from "./api.client";
import { ApiError, AuthError } from "./errors";

export type SelectableProfile = "buyer" | "seller";

/** Resposta da seleção/renovação, sem os tokens (ficam nos cookies). */
export interface ProfileSession {
  token_type: "bearer";
  /** Validade do access token em segundos — depende do ambiente. */
  expires_in: number;
  profile: SelectableProfile;
  context_version: 1;
}

/** Contexto atual validado pela identity-api (`GET /auth/context`). */
export interface ProfileContext {
  /** Organização das chamadas da geo-api — vale esta, não a do /me. */
  organization_id: string;
  user_id: string;
  profile: SelectableProfile;
  roles: string[];
  permissions: string[];
  kyc_level: string;
  kyc_state: string;
  transaction_eligible: boolean;
  profile_version: number;
  grant_version: number;
  context_version: 1;
}

// Uma renovação por vez: chamadas simultâneas que recebem 401 esperam a
// mesma. Duas renovações com o mesmo refresh_token revogariam a família.
let refreshing: Promise<ProfileSession> | null = null;

// Avisados quando a sessão de perfil não pode mais ser renovada.
const expiredListeners = new Set<() => void>();

export const profileSessionService = {
  /** Seleciona o perfil com a sessão do login. 403 sem o perfil liberado. */
  select: (profile: SelectableProfile) =>
    api.post<ProfileSession>("/auth/context", { profile }),

  /** Contexto atual. 401 sem sessão de perfil ou com o token vencido. */
  current: (options: { signal?: AbortSignal } = {}) =>
    api.get<ProfileContext>("/auth/context", { signal: options.signal }),

  /** Renova o par do perfil (single-flight). */
  refresh: () => {
    refreshing ??= api
      .post<ProfileSession>("/auth/context/refresh")
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  },

  /** Encerra só a sessão de perfil; o login continua. */
  end: () => api.delete<void>("/auth/context"),

  /**
   * Registra quem reage à perda da sessão de perfil (renovação recusada) —
   * o provider da área do seller manda para o login. Devolve o cancelamento.
   */
  onExpired: (listener: () => void) => {
    expiredListeners.add(listener);
    return () => {
      expiredListeners.delete(listener);
    };
  },
};

/**
 * Executa uma chamada autenticada pela sessão de perfil. Em 401, renova uma
 * única vez e repete; se a renovação for recusada, avisa `onExpired` (novo
 * login) e propaga o erro. 403 não renova: é falta de permissão, não de token.
 */
export async function withProfileSession<T>(
  call: () => Promise<T>,
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
  }

  try {
    await profileSessionService.refresh();
  } catch (error) {
    // 4xx = refresh vencido, revogado ou ausente. 5xx/rede: tenta depois.
    if (error instanceof ApiError && error.status < 500) {
      expiredListeners.forEach((listener) => listener());
    }
    throw error;
  }

  return call();
}
