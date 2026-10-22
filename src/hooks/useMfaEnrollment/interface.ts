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

/**
 * Contrato do cadastro. Os tokens e corpos de um não servem no outro:
 * - `firstLogin` (NEU-479): `/mfa/enroll` com o token do login + senha, que
 *   devolve uma credencial NOVA para o `/mfa/enroll/confirm`;
 * - `onboarding` (NEU-563, aceite de convite de organização):
 *   `/mfa/enrollment/start` e `/mfa/enrollment/confirm`, os dois com o mesmo
 *   `mfa_enrollment_token` como Bearer e sem senha.
 */
export type MfaEnrollmentContract = "firstLogin" | "onboarding";

/** O que o login (ou o aceite do convite) entrega ao abrir o cadastro. */
export interface MfaEnrollmentStart {
  /** Padrão: `firstLogin`. */
  contract?: MfaEnrollmentContract;
  /** `mfa_enrollment_token` recebido — credencial opaca. */
  enrollmentToken: string;
  /**
   * Senha atual; só serve à troca do /mfa/enroll e é descartada em seguida.
   * Obrigatória no `firstLogin`; ignorada no `onboarding`.
   */
  password?: string;
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
   * Encerra o cadastro e volta às credenciais (no onboarding, à tela de
   * login). `message` (já traduzida) explica o motivo; ausente quando o
   * próprio usuário saiu.
   */
  onRestart: (message?: string) => void;
  /** Sessão criada pelo BFF — segue para a área autenticada. */
  onComplete: () => void;
}
