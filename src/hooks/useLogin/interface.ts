/**
 * Etapas do login. O desafio de MFA é uma etapa da MESMA página, não uma rota
 * separada: assim o `mfa_challenge_token` nunca sai da memória do componente
 * (não vai para a URL, nem para sessionStorage).
 */
export type LoginStep = "credentials" | "mfa";

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
