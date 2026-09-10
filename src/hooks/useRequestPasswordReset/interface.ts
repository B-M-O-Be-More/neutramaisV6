/**
 * Estados da tela de recuperação de senha (US-03):
 * - `form`    — formulário de e-mail (estado inicial e o de "tentar de novo")
 * - `loading` — request em voo ("Verificando conta...")
 * - `success` — link de redefinição enviado
 * - `error`   — a request falhou (rede, timeout ou erro HTTP)
 */
export type ForgotPasswordStatus = "form" | "loading" | "success" | "error";
