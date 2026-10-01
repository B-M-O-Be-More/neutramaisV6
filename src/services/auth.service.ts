// Service de autenticação — confirmação de e-mail/telefone e afins.
// Segue o padrão do SDD §12.2: funções por operação, sem React nem tratamento
// de erro (propaga AppError tipado). O browser fala com o BFF (`/api/*`).

import { api } from "./api.client";

export interface ConfirmEmailParams {
  /** Token de confirmação recebido no link do e-mail. */
  token: string;
  /** ID do usuário recebido no link do e-mail. */
  userId: string;
}

/** Resultado de `GET /auth/confirm-email` (data do envelope; shape não garantido). */
export interface ConfirmEmailResult {
  email_confirmed?: boolean;
  status?: string;
}

/** Payload de `POST /auth/password-reset/request`. */
export interface PasswordResetRequestBody {
  email: string;
}

/**
 * Payload de `POST /auth/resend-phone-otp`. Dispara o SMS com o código.
 *
 * O `user_id` vai no corpo porque a chamada acontece na etapa de Verificação do
 * cadastro, antes de existir sessão. (A coleção do Insomnia documenta o corpo
 * como `{}`, presumindo usuário autenticado — o contrato em uso é este.)
 */
export interface ResendPhoneOtpBody {
  user_id: string;
}

/**
 * Payload de `POST /auth/confirm-phone`.
 *
 * ATENÇÃO ao nome do campo do código: é `otp`, não `code` como consta na
 * coleção do Insomnia.
 */
export interface ConfirmPhoneBody {
  user_id: string;
  otp: string;
}

/** Payload de `POST /auth/login`. */
export interface LoginBody {
  email: string;
  password: string;
  /**
   * Token do hCaptcha. O upstream passa a exigir este campo a partir da 3ª
   * tentativa falha de login (artefato: Auth & Tokens · /auth/login).
   */
  "h-captcha-response"?: string;
}

/**
 * Header que leva o "manter conectado" do login ao BFF. Fica fora do corpo
 * para o payload ser exatamente o `LoginRequest` da identity-api; o BFF usa o
 * valor só para decidir se os cookies de sessão são persistentes.
 */
export const REMEMBER_ME_HEADER = "X-Remember-Me";

/**
 * Payload de `POST /auth/mfa/verify`. O código vem em EXATAMENTE UM de
 * `totp_code` | `recovery_code`.
 *
 * ATENÇÃO ao nome do campo da credencial: o login devolve `mfa_challenge_token`,
 * mas o verify espera `challenge_token`. Verificado contra a API de homologação —
 * o artefato e a coleção do Insomnia documentam `mfa_challenge_token` aqui, e o
 * upstream recusa esse nome com `extra_forbidden`. O endpoint também rejeita
 * qualquer campo desconhecido, por isso `rememberMe` é removido pelo BFF antes
 * do encaminhamento.
 */
export interface MfaVerifyBody {
  challenge_token: string;
  totp_code?: string;
  recovery_code?: string;
  /** Sinal só do front (persistência do cookie), igual ao login. */
  rememberMe?: boolean;
}

/**
 * Payload de `POST /auth/mfa/enroll` — início do cadastro de MFA obrigatório no
 * primeiro login (NEU-479). Sem Bearer: a credencial é o `mfa_enrollment_token`
 * de uso único devolvido pelo login, mais a senha atual.
 */
export interface MfaEnrollStartBody {
  enrollment_token: string;
  password: string;
}

/**
 * Resposta de `POST /auth/mfa/enroll`. Os segredos são devolvidos UMA vez e
 * não podem ser recuperados depois — só vivem na memória da tela.
 */
export interface MfaEnrollmentSetup {
  /** URI `otpauth://totp/...` — o QR é gerado localmente a partir dela. */
  otpauth_uri: string;
  /** Chave base32 para cadastro manual no autenticador. */
  manual_key: string;
  /** Códigos de recuperação. A quantidade é configurável no servidor. */
  recovery_codes: string[];
  /** NOVA credencial, agora de confirmação — substitui a do login. */
  enrollment_token: string;
  /** Prazo (s) da credencial de confirmação. */
  expires_in: number;
}

/**
 * Payload de `POST /auth/mfa/enroll/confirm`. `totp_code` é string de seis
 * dígitos (preserva zeros à esquerda); código de recuperação não confirma.
 */
export interface MfaEnrollConfirmBody {
  enrollment_token: string;
  totp_code: string;
  /** Sinal só do front (persistência do cookie), igual ao login. */
  rememberMe?: boolean;
}

/** Payload de `POST /auth/password-reset/execute`. */
export interface PasswordResetExecuteBody {
  /** Token recebido no link do e-mail — é a credencial da operação. */
  token: string;
  /** Nova senha; mínimo de 12 caracteres (RN-528). */
  new_password: string;
}

/**
 * Resposta de `POST /auth/login` visível ao browser. Os tokens NÃO vêm no corpo:
 * o BFF grava access_token/refresh_token em cookies httpOnly (ADR-002). Sobra só
 * o estado de MFA.
 */
export interface LoginResponse {
  mfa_required: boolean;
  mfa_challenge_token?: string | null;
  /**
   * MFA obrigatório ainda não cadastrado (Admin/Seller no primeiro login). Tem
   * prioridade sobre `mfa_required`: abre a configuração do autenticador, não o
   * desafio.
   */
  mfa_enrollment_required?: boolean;
  /** Credencial opaca de início do cadastro — de uso único, nunca como Bearer. */
  mfa_enrollment_token?: string | null;
  /** Com cadastro pendente, é o prazo (s) do `mfa_enrollment_token`. */
  expires_in?: number;
}

/** Perfil do usuário autenticado — `GET /me`. */
export interface MeProfile {
  id: string;
  organization_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  status: string;
  created_at: string;
  last_login_at: string | null;
  /** Ex.: ["buyer_owner"]. */
  roles: string[];
  permissions: string[];
  /** Estado de MFA do token corrente. */
  mfa: boolean;
}

export const authService = {
  /**
   * Perfil do usuário da sessão corrente. GET /api/v1/me
   *
   * 401/403 significam token ausente, expirado ou inválido — o chamador tenta
   * `refresh` e, se falhar, encerra a sessão.
   */
  me: (options: { signal?: AbortSignal } = {}) =>
    api.get<MeProfile>("/me", { signal: options.signal }),

  /**
   * Confirma o e-mail a partir do `token` + `user_id` enviados por link.
   * GET /api/v1/auth/confirm-email?token=...&user_id=...
   */
  confirmEmail: ({ token, userId }: ConfirmEmailParams) =>
    api.get<ConfirmEmailResult>("/auth/confirm-email", {
      params: { token, user_id: userId },
    }),

  /** Reenvia o e-mail de confirmação para o usuário. */
  resendEmailConfirmation: (userId: string) =>
    api.post<null>(`/users/${userId}/resend-email-confirmation`),

  /**
   * Envia (ou reenvia) por SMS o OTP de confirmação do telefone.
   * POST /api/v1/auth/resend-phone-otp
   */
  resendPhoneOtp: (userId: string) => {
    const body: ResendPhoneOtpBody = { user_id: userId };
    return api.post<null>("/auth/resend-phone-otp", body);
  },

  /**
   * Confirma o telefone com o OTP recebido por SMS.
   * POST /api/v1/auth/confirm-phone
   */
  confirmPhone: (body: ConfirmPhoneBody) =>
    api.post<null>("/auth/confirm-phone", body),

  /**
   * Solicita o e-mail de redefinição de senha.
   * POST /api/v1/auth/password-reset/request
   *
   * Responde sempre 200 com a mesma mensagem, exista ou não a conta — não dá
   * para inferir daqui se o e-mail está cadastrado (proteção contra enumeração).
   */
  requestPasswordReset: (email: string) => {
    const body: PasswordResetRequestBody = { email };
    return api.post<null>("/auth/password-reset/request", body);
  },

  /**
   * Autentica com e-mail e senha. POST /api/v1/auth/login
   *
   * Em sucesso sem MFA, o BFF já estabeleceu a sessão via cookies httpOnly e
   * `data` só informa `mfa_required: false`. Com MFA habilitado, nenhum token é
   * emitido: vem `mfa_required: true` + `mfa_challenge_token` para resolver em
   * `mfaVerify`.
   */
  login: (body: LoginBody, rememberMe = false) =>
    api.post<LoginResponse>("/auth/login", body, {
      headers: { [REMEMBER_ME_HEADER]: String(rememberMe) },
    }),

  /**
   * Resolve o desafio de MFA aberto pelo login. POST /api/v1/auth/mfa/verify
   *
   * Envie `totp_code` OU `recovery_code` — nunca os dois. Em sucesso o BFF grava
   * o par final de tokens nos cookies.
   *
   * Dois erros distintos, ambos 401: `INVALID_MFA_CODE` quando o código não bate
   * (o upstream não distingue TOTP de recovery, de propósito) e
   * `MFA_CHALLENGE_INVALID` quando o próprio desafio expirou — nesse caso não há
   * o que retentar, é preciso refazer o login.
   */
  mfaVerify: (body: MfaVerifyBody) => api.post<null>("/auth/mfa/verify", body),

  /**
   * Inicia o cadastro de MFA obrigatório do primeiro login.
   * POST /api/v1/auth/mfa/enroll
   *
   * Consome o `mfa_enrollment_token` do login e devolve os segredos do
   * autenticador + a credencial de confirmação. Um novo início substitui o
   * cadastro pendente anterior (QR/chave/códigos antigos deixam de valer).
   */
  mfaEnrollStart: (body: MfaEnrollStartBody) =>
    api.post<MfaEnrollmentSetup>("/auth/mfa/enroll", body),

  /**
   * Conclui o cadastro com o primeiro TOTP do autenticador.
   * POST /api/v1/auth/mfa/enroll/confirm
   *
   * Só aqui a sessão é criada: o BFF grava o par de tokens nos cookies.
   * `401 INVALID_MFA_CODE` permite nova tentativa com a mesma credencial;
   * `401 MFA_ENROLLMENT_TOKEN_INVALID` exige refazer o login.
   */
  mfaEnrollConfirm: (body: MfaEnrollConfirmBody) =>
    api.post<null>("/auth/mfa/enroll/confirm", body),

  /**
   * Renova o par de tokens. POST /api/v1/auth/refresh
   *
   * Sem corpo: o refresh_token vive em cookie httpOnly e é lido pelo BFF, que
   * também regrava o novo par. Falha (401) significa sessão encerrada.
   */
  refresh: () => api.post<null>("/auth/refresh"),

  /** Encerra a sessão e limpa os cookies. POST /api/v1/auth/logout (204). */
  logout: () => api.post<null>("/auth/logout"),

  /**
   * Revoga um refresh_token. POST /api/v1/auth/revoke
   *
   * O upstream identifica o token pelo próprio `refresh_token` — não pelo `jti`,
   * como o artefato e a coleção do Insomnia indicam (verificado contra a API de
   * homologação: `{"jti"}` responde 422 exigindo `refresh_token`).
   *
   * Sem argumento, o BFF revoga o refresh_token da sessão corrente (lido do
   * cookie). Revogar a sessão de OUTRO dispositivo não é possível a partir do
   * browser: sob o ADR-002 o refresh_token nunca chega ao JS.
   */
  revoke: (refreshToken?: string) =>
    api.post<null>(
      "/auth/revoke",
      refreshToken ? { refresh_token: refreshToken } : {},
    ),

  /**
   * Efetiva a nova senha usando o token recebido por e-mail.
   * POST /api/v1/auth/password-reset/execute
   */
  executePasswordReset: (body: PasswordResetExecuteBody) =>
    api.post<null>("/auth/password-reset/execute", body),
};
