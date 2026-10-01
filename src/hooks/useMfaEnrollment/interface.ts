/**
 * Fases do cadastro de MFA do primeiro login (NEU-479), dentro da mesma página
 * do login — nada vai para a URL:
 * - `intro`: explica por que o MFA é obrigatório; ainda com a credencial de
 *   início do login e a senha em memória.
 * - `qrCode` → `recoveryCodes` → `totp`: telas da configuração, já com os
 *   segredos e a credencial de confirmação. O usuário avança e volta entre elas
 *   sem nova chamada ao backend.
 * - `failed`: o cadastro em curso morreu (erro, limite de tentativas ou prazo);
 *   os segredos já foram descartados e só resta voltar ao login.
 */
export type MfaEnrollmentPhase =
  | "intro"
  | "qrCode"
  | "recoveryCodes"
  | "totp"
  | "failed";

/** Fases da configuração entre as quais o usuário navega livremente. */
export type MfaEnrollmentSetupPhase = "qrCode" | "recoveryCodes" | "totp";

/**
 * Por que o cadastro terminou em `failed` — cada motivo tem a própria tela:
 * - `error`: falha do serviço, resposta perdida ou conta que já tem MFA ativo
 *   (o estado real só se descobre refazendo o login);
 * - `rateLimit`: tentativas esgotadas na janela do backend;
 * - `timeout`: prazo da etapa vencido ou credencial invalidada.
 */
export type MfaEnrollmentFailure = "error" | "rateLimit" | "timeout";

/** O que o login entrega ao abrir o cadastro. */
export interface MfaEnrollmentStart {
  /** `mfa_enrollment_token` do login — credencial opaca e de uso único. */
  enrollmentToken: string;
  /** Senha atual; só serve à troca do /mfa/enroll e é descartada em seguida. */
  password: string;
  /** Prazo (s) da credencial de início. */
  expiresIn: number;
  /** "Manter conectado" escolhido no login — aplicado à sessão final. */
  rememberMe: boolean;
}

/** Segredos do autenticador, exibidos uma única vez. */
export interface MfaEnrollmentSecrets {
  otpauthUri: string;
  manualKey: string;
  recoveryCodes: string[];
}

export interface UseMfaEnrollmentOptions {
  /**
   * Encerra o cadastro e volta às credenciais. `message` (já traduzida) explica
   * o motivo; ausente quando o próprio usuário saiu.
   */
  onRestart: (message?: string) => void;
  /** Sessão criada pelo BFF — segue para a área autenticada. */
  onComplete: () => void;
}
