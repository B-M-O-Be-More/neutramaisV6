/**
 * Célula de CSV: entre aspas (com aspas dobradas) quando o texto tem vírgula,
 * aspas, ponto e vírgula ou quebra de linha.
 */
export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
