/**
 * Oferece um texto para download (`.txt` por padrão), gerado inteiramente no
 * browser (Blob + object URL) — o conteúdo não passa por servidor nem storage.
 */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = "text/plain",
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
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
