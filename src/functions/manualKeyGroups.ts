/**
 * Agrupa a chave base32 do autenticador em blocos de 4 caracteres, só para
 * leitura/digitação (ex.: "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP"). A cópia
 * usa a chave original, sem os espaços.
 */
export function manualKeyGroups(key: string): string {
  return (
    key
      .replace(/\s+/g, "")
      .match(/.{1,4}/g)
      ?.join(" ") ?? ""
  );
}
