/**
 * Estados da tela de redefinição de senha:
 * - `form`    — formulário de nova senha
 * - `success` — senha alterada, pode entrar
 * - `error`   — token inválido/expirado ou falha na chamada
 * - `missing` — link sem `token` na query (nada a fazer)
 */
export type ResetPasswordStatus = "form" | "success" | "error" | "missing";
