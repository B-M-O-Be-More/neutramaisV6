// Service do aceite de convites (NEU-563): uma rota para convites de
// organização (Buyer/Seller) e de administradores da plataforma.
// Sem React e sem tratamento de erro: propaga AppError tipado para o hook.
// O browser fala com o BFF (`/api/invites/*`).

import { api } from "./api.client";

/**
 * Corpo de `POST /invites/accept`. Só estes campos: tipo, papel, e-mail e
 * organização vêm do convite salvo, e qualquer campo extra é recusado (422).
 */
export interface AcceptInviteDto {
  /** Token do link — é a credencial da operação. */
  token: string;
  display_name: string;
  /** E.164. Obrigatório no convite de plataforma; opcional no de organização. */
  phone: string;
  password: string;
}

/** Convite de plataforma: a conta existe, o MFA é configurado no 1º login. */
export interface AcceptPlatformInviteResult {
  next_step: "login";
  user_id: string;
  email: string;
  mfa_enrollment_required: true;
}

/**
 * Convite de organização. Com `next_step: "home"` a sessão já foi criada (o
 * BFF grava os tokens em cookies httpOnly e os tira do corpo). Com
 * `"mfa_enrollment"` ainda não há sessão: ela nasce no fim do cadastro do
 * autenticador, com `mfa_enrollment_token` como Bearer.
 */
export interface AcceptOrganizationInviteResult {
  next_step: "home" | "mfa_enrollment";
  user_id: string;
  organization_id: string;
  membership_id: string;
  role: string;
  mfa_enrollment_required: boolean;
  mfa_enrollment_token: string | null;
  mfa_enrollment_expires_in: number | null;
  /** Sem token de cadastro, um link de configuração pode ter ido por e-mail. */
  mfa_enrollment_link_sent: boolean;
}

export type AcceptInviteResult =
  | AcceptPlatformInviteResult
  | AcceptOrganizationInviteResult;

/** Resposta de `POST /invites/{token}/redeem`. */
export interface RedeemInviteResult {
  membership_id: string;
  organization_id: string;
  role: string;
}

export const invitesService = {
  /**
   * Cria a conta de quem ainda não tem uma, a partir do convite. Pública: o
   * token é a credencial. 409 = o e-mail já tem conta (o convite não é
   * consumido; o caminho é entrar e usar `redeem`).
   */
  accept: (data: AcceptInviteDto) =>
    api.post<AcceptInviteResult>("/invites/accept", data),

  /**
   * Resgata um convite de organização com uma conta existente, usando a sessão
   * do usuário. O token vai no corpo para o BFF — nunca na URL do browser.
   */
  redeem: (token: string) =>
    api.post<RedeemInviteResult>("/invites/redeem", { token }),
};
