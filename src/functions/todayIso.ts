/**
 * Data de hoje no fuso local, "AAAA-MM-DD" — o mesmo formato do
 * `<input type="date">`, então dá para comparar como texto.
 */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
