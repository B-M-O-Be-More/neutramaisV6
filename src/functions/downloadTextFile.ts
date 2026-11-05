import { downloadBlob } from "./downloadBlob";

/**
 * Oferece um texto para download (`.txt` por padrão), gerado inteiramente no
 * browser (Blob + object URL) — o conteúdo não passa por servidor nem storage.
 */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = "text/plain",
): void {
  downloadBlob(
    fileName,
    new Blob([content], { type: `${mimeType};charset=utf-8` }),
  );
}
