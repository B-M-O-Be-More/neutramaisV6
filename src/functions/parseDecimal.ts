/**
 * Lê um número digitado em formato brasileiro ou internacional: "98,5",
 * "98.5", "1.000,5", "98,5%". Devolve `null` quando não é um número.
 *
 * Com vírgula, o ponto é separador de milhar; sem vírgula, o ponto é decimal.
 */
export function parseDecimal(value: string | null | undefined): number | null {
  if (!value) return null;
  let text = value.trim().replace(/%$/, "").trim();
  if (!text) return null;

  text = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;

  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}
