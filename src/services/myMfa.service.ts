// Service do 2FA do usuário da sessão (identity-api `/users/me/mfa/*`).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
//
// Só há o método TOTP (app autenticador). O cadastro do primeiro login usa
// outro fluxo (token de cadastro, `auth.service`); este é o do Meu Perfil.

import { api } from "./api.client";

/** `GET /users/me/mfa/status`. */
export interface MyMfaStatus {
  /** true só com o autenticador confirmado. */
  enrolled: boolean;
  enrolled_at: string | null;
  recovery_codes_remaining: number;
}

/** `POST /users/me/mfa/enroll` — devolvido uma única vez. */
export interface MyMfaEnrollment {
  /** `otpauth://totp/...` para o QR code. */
  otpauth_uri: string;
  recovery_codes: string[];
}

export const myMfaService = {
  status: (options: { signal?: AbortSignal } = {}) =>
    api.get<MyMfaStatus>("/users/me/mfa/status", { signal: options.signal }),

  /** Começa o cadastro. 403 com a senha errada; 409 já cadastrado. */
  enroll: (password: string) =>
    api.post<MyMfaEnrollment>("/users/me/mfa/enroll", { password }),

  /** Confirma com o primeiro código. 401 com o código errado. */
  confirm: (totpCode: string) =>
    api.post<{ message: string }>("/users/me/mfa/confirm", {
      totp_code: totpCode,
    }),

  /**
   * Step-up: prova o autenticador dentro da sessão atual e a sessão passa a
   * ter `mfa: true` (o BFF troca os cookies). Pedido por rotas que exigem
   * MFA (403 `mfa_required`). 401 com o código errado; 403
   * `MFA_ENROLLMENT_REQUIRED` sem autenticador; 429 após 5 tentativas.
   */
  stepUp: (totpCode: string) =>
    api.post<{ mfa: true; profile: string | null }>("/auth/mfa/step-up", {
      totp_code: totpCode,
    }),

  /**
   * Desliga o 2FA. 409 quando o papel exige 2FA; 401 com senha ou código
   * errados.
   */
  disable: (password: string, totpCode: string) =>
    api.post<{ message: string }>("/users/me/mfa/disable", {
      password,
      totp_code: totpCode,
    }),
};
