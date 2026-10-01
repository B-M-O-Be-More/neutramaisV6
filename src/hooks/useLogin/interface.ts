/**
 * Etapas do login. O desafio de MFA e o cadastro de MFA obrigatório do primeiro
 * login são etapas da MESMA página, não rotas separadas: assim as credenciais
 * de curta duração (`mfa_challenge_token`, `mfa_enrollment_token`) e os segredos
 * do autenticador nunca saem da memória (não vão para a URL, nem para storage).
 */
export type LoginStep = "credentials" | "mfa" | "mfaEnrollment";

/** Valores das credenciais, já validados pelo loginSchema. */
export interface CredentialsInput {
  email: string;
  password: string;
  rememberMe: boolean;
  /** Token do hCaptcha, quando a tela já estiver exigindo o desafio. */
  captchaToken?: string;
}

/** Código do segundo fator: exatamente um dos dois é preenchido. */
export interface MfaInput {
  totpCode?: string;
  recoveryCode?: string;
}
