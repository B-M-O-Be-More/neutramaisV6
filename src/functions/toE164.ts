/**
 * Normaliza um telefone (possivelmente mascarado, ex.: "+55 (11) 99999-9999")
 * para o formato E.164 exigido pela identity-api: "+5511999999999".
 * A máscara do formulário sempre inclui o DDI, então basta preservar o "+"
 * e concatenar os dígitos.
 */
export function toE164(input: string | undefined | null): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}
