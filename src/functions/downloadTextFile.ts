/**
 * Oferece um texto para download como arquivo `.txt`, gerado inteiramente no
 * browser (Blob + object URL) — o conteúdo não passa por servidor nem storage.
 */
export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
