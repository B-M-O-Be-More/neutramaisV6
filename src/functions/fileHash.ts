/**
 * SHA-256 hexadecimal de um arquivo, no formato que a identity-api espera no
 * campo `content_hash` de `POST /organizations/{org_id}/kyc/artifacts` (64 chars).
 *
 * Usa a Web Crypto do próprio browser (`crypto.subtle`), sem dependência nova.
 * Só funciona em contexto seguro (https ou localhost) — que é onde a aplicação
 * roda de todo modo.
 */
export async function sha256Hex(file: Blob): Promise<string> {
  // Passa uma view (Uint8Array) e não o ArrayBuffer cru: sob jsdom o buffer vem
  // de outro realm e o WebCrypto do Node o recusa na checagem de tipo. O
  // browser aceita qualquer BufferSource, então isto não muda nada em produção.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
