import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * Política de senha da identity-api (RN-528) — fonte única.
 *
 * Verificada contra a API de homologação em `POST /organizations/register`:
 *   - mínimo 12 caracteres  → 422 `string_too_short`
 *   - maiúscula, dígito e símbolo → 400 com
 *     `metadata.detail.violations: ["missing_uppercase", "missing_digit",
 *     "missing_symbol"]`
 *
 * Existia divergência entre as telas: o cadastro exigia 8 caracteres + letra +
 * dígito, e a redefinição exigia 12 + maiúscula + dígito + símbolo. Só a segunda
 * batia com o servidor. Centralizado aqui para não voltar a divergir.
 *
 * Deliberadamente NÃO exigimos minúscula: o servidor pode ter a regra
 * `missing_lowercase`, mas não consegui confirmar (rate limit durante a sondagem).
 * Ser mais estrito que o servidor rejeitaria senha válida no cliente; se a regra
 * existir, a violação chega do upstream e é exibida no campo.
 * ------------------------------------------------------------------------- */

export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  digit: /\d/,
  symbol: /[^A-Za-z0-9]/,
} as const;

/** Chaves de tradução das mensagens, por schema consumidor. */
export interface PasswordMessages {
  required: string;
  tooShort: string;
  uppercase: string;
  digit: string;
  symbol: string;
}

/**
 * Monta a regra yup de senha com as mensagens do schema chamador. As mensagens
 * são CHAVES de tradução, resolvidas na exibição — mesmo padrão dos outros schemas.
 */
export function passwordRule(messages: PasswordMessages) {
  return yup
    .string()
    .required(messages.required)
    .min(MIN_PASSWORD_LENGTH, messages.tooShort)
    .matches(PASSWORD_PATTERNS.uppercase, messages.uppercase)
    .matches(PASSWORD_PATTERNS.digit, messages.digit)
    .matches(PASSWORD_PATTERNS.symbol, messages.symbol);
}

/**
 * Traduz as `violations` devolvidas pelo upstream para chaves de tradução do
 * schema chamador. Cobre inclusive `missing_lowercase`, que não validamos no
 * cliente.
 */
export function violationMessage(
  violation: string,
  messages: PasswordMessages & { lowercase?: string },
): string | undefined {
  switch (violation) {
    case "too_short":
      return messages.tooShort;
    case "missing_uppercase":
      return messages.uppercase;
    case "missing_digit":
      return messages.digit;
    case "missing_symbol":
      return messages.symbol;
    case "missing_lowercase":
      return messages.lowercase;
    default:
      return undefined;
  }
}
