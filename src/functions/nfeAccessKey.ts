/** Chave de acesso da NF-e: 44 dígitos, o último é o dígito verificador. */
export const NFE_ACCESS_KEY_LENGTH = 44;

/** Só os dígitos (a chave costuma vir separada em blocos de 4). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Dígito verificador da chave (módulo 11, pesos de 2 a 9 da direita para a
 * esquerda sobre os 43 primeiros dígitos). Resto 0 ou 1 vira 0.
 */
function checkDigit(first43: string): number {
  let sum = 0;
  let weight = 2;
  for (let index = first43.length - 1; index >= 0; index -= 1) {
    sum += Number(first43[index]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** 44 dígitos com dígito verificador válido — o mesmo que a orders-api confere. */
export function isValidNfeAccessKey(value: string): boolean {
  const key = onlyDigits(value);
  if (key.length !== NFE_ACCESS_KEY_LENGTH) return false;
  return checkDigit(key.slice(0, 43)) === Number(key[43]);
}

/** CNPJ do emitente: posições 7 a 20 da chave. A API exige que bata. */
export function cnpjFromNfeAccessKey(value: string): string | null {
  const key = onlyDigits(value);
  return key.length === NFE_ACCESS_KEY_LENGTH ? key.slice(6, 20) : null;
}

/** Chave em blocos de 4, como no DANFE: 2326 1012 3456 ... */
export function formatNfeAccessKey(value: string): string {
  return onlyDigits(value)
    .slice(0, NFE_ACCESS_KEY_LENGTH)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}
