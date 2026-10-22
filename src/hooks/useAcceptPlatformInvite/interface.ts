/**
 * Estados da tela de aceite do convite:
 * - `checking` — lendo o token do link (só existe no browser)
 * - `form`     — formulário de criação da conta
 * - `success`  — conta criada, pode entrar
 * - `error`    — convite inválido, expirado ou já usado
 * - `missing`  — link sem `token` (nada a fazer)
 */
export type AcceptPlatformInviteStatus =
  | "checking"
  | "form"
  | "success"
  | "error"
  | "missing";

export interface AcceptPlatformInviteInput {
  displayName: string;
  phone: string;
  password: string;
}

/** Erro que cabe num campo do formulário (chave de tradução). */
export interface AcceptPlatformInviteFieldError {
  field: "displayName" | "phone" | "password";
  message: string;
}

export interface UseAcceptPlatformInviteReturn {
  status: AcceptPlatformInviteStatus;
  isSubmitting: boolean;
  /** Erro geral do formulário (chave de tradução), ou undefined. */
  formError?: string;
  /** Erro de um campo específico devolvido pela API, ou undefined. */
  fieldError?: AcceptPlatformInviteFieldError;
  submit: (input: AcceptPlatformInviteInput) => Promise<void>;
}
