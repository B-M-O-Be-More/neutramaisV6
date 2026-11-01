/**
 * Oferece um Blob para download (Blob + object URL), com o nome dado — ex.: o
 * KMZ original baixado da geo-api pelo BFF.
 */
export function downloadBlob(fileName: string, blob: Blob): void {
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
