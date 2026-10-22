import type { UseMfaEnrollmentReturn } from "@/hooks/useMfaEnrollment";

/**
 * Estados da tela de aceite (`/accept/#token=...`):
 * - `checking`        — lendo o token do link (só existe no browser)
 * - `missing`         — link sem token
 * - `form`            — nome, telefone e senha
 * - `entering`        — sessão criada; indo para a área autenticada
 * - `mfaEnrollment`   — organização com MFA obrigatório: cadastro do app
 * - `created`         — conta criada sem sessão; o próximo passo é o login
 * - `existingAccount` — o e-mail já tem conta (409): entrar para aceitar
 * - `login`           — login na própria tela, com o token ainda em memória
 * - `redeemConflict`  — a conta não pode entrar nesta organização
 * - `invalid`         — convite inexistente, vencido, usado ou recusado (410)
 */
export type AcceptInviteStatus =
  | "checking"
  | "missing"
  | "form"
  | "entering"
  | "mfaEnrollment"
  | "created"
  | "existingAccount"
  | "login"
  | "redeemConflict"
  | "invalid";

/**
 * Por que a conta foi criada sem sessão:
 * - `login`      — convite de plataforma: MFA no primeiro login;
 * - `mfaLink`    — organização com MFA: o link de configuração foi por e-mail;
 * - `mfaPending` — organização com MFA, sem link: configurar entrando.
 */
export type AcceptInviteCreated = "login" | "mfaLink" | "mfaPending";

export interface AcceptInviteInput {
  displayName: string;
  phone: string;
  password: string;
}

/** Erro que cabe num campo do formulário (chave de tradução). */
export interface AcceptInviteFieldError {
  field: "displayName" | "phone" | "password";
  message: string;
}

export interface UseAcceptInviteReturn {
  status: AcceptInviteStatus;
  /** Só em `created`. */
  created: AcceptInviteCreated | null;
  isSubmitting: boolean;
  /** Erro geral do formulário (chave de tradução), ou undefined. */
  formError?: string;
  /** Erro de um campo específico devolvido pela API, ou undefined. */
  fieldError?: AcceptInviteFieldError;
  submit: (input: AcceptInviteInput) => Promise<void>;
  /** Cadastro de MFA do onboarding (usado em `mfaEnrollment`). */
  enrollment: UseMfaEnrollmentReturn;
  /** Conta existente: abre o login na própria tela. */
  startLogin: () => void;
  /** Chamado pelo login quando a sessão nasce: resgata o convite. */
  redeem: () => Promise<void>;
}
