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

/**
 * Corpo de `POST /admin/platform-invites`. O campo é `role`, igual ao do
 * convite de organização: o antigo `target_role` é recusado (422).
 */
export interface PlatformInviteDto {
  email: string;
  role: PlatformRole;
}

export const platformInvitesService = {
  /**
   * Convida um novo operador da plataforma por e-mail. O backend envia o link
   * (`/accept/#token=...`); o aceite é o do invitesService.
   * Exige `super_admin` com MFA confirmado na sessão.
   */
  invite: (data: PlatformInviteDto) =>
    api.post<unknown>("/admin/platform-invites", data),
};
