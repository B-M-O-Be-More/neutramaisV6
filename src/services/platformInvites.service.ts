// Service de convites de operadores da plataforma (SDD §12.2).
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/*`).

import { api } from "./api.client";

/** Papéis que um operador da plataforma pode receber no convite. */
export const PLATFORM_ROLES = [
  "support",
  "finance",
  "compliance",
  "legal",
  "operations",
  "sre",
  "super_admin",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Corpo de `POST /admin/platform-invites`. */
export interface PlatformInviteDto {
  email: string;
  target_role: PlatformRole;
}

/** Corpo de `POST /platform-invites/accept`. */
export interface AcceptPlatformInviteDto {
  /** Token recebido no link do e-mail — é a credencial da operação. */
  token: string;
  display_name: string;
  /** E.164, ex.: "+5511999999999". */
  phone: string;
  password: string;
}

export const platformInvitesService = {
  /**
   * Convida um novo operador da plataforma por e-mail.
   * Exige `super_admin` com MFA confirmado na sessão.
   */
  invite: (data: PlatformInviteDto) =>
    api.post<unknown>("/admin/platform-invites", data),

  /**
   * Cria a conta do operador a partir do convite recebido por e-mail. Pública:
   * o `token` do link é a credencial.
   */
  accept: (data: AcceptPlatformInviteDto) =>
    api.post<unknown>("/platform-invites/accept", data),
};
