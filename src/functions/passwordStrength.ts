import { MIN_PASSWORD_LENGTH } from "@/schemas/password";

export type PasswordStrengthLevel = "weak" | "medium" | "strong";

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  /** Rótulo em PT-BR para exibição. */
  label: string;
  /** Valor 0–100 para a barra de progresso. */
  value: number;
  /** Etapas preenchidas (1–3) para o indicador de barras. */
  step: 1 | 2 | 3;
  /** colorPalette do Chakra. */
  colorPalette: "red" | "orange" | "green";
}

/**
 * Indicador visual de força de senha (US-02).
 *
 * Os critérios espelham a política real da identity-api (ver schemas/password):
 * mínimo de 12 caracteres, maiúscula, dígito e símbolo. Antes o comprimento
 * pontuava a partir de 8, então uma senha de 9 caracteres aparecia como "Forte"
 * e o servidor a recusava — o medidor precisa concordar com o que é aceito.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      level: "weak",
      label: "Fraca",
      value: 33,
      step: 1,
      colorPalette: "red",
    };
  }

  if (score <= 3) {
    return {
      level: "medium",
      label: "Média",
      value: 66,
      step: 2,
      colorPalette: "orange",
    };
  }

  return {
    level: "strong",
    label: "Forte",
    value: 100,
    step: 3,
    colorPalette: "green",
  };
}
