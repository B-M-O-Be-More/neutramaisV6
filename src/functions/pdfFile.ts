/** Limite da NF na orders-api: 2 MiB. */
export const INVOICE_PDF_MAX_BYTES = 2 * 1024 * 1024;

/** A orders-api procura o `%%EOF` nos últimos 1024 bytes. */
const EOF_WINDOW = 1024;

export type PdfReadResult =
  | { base64: string }
  | { error: "tooLarge" | "notPdf" | "unreadable" };

function readBytes(file: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function ascii(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
}

/** Base64 padrão, em blocos para não estourar a pilha com arquivos grandes. */
function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary);
}

/**
 * Lê o PDF da NF e confere o que a orders-api confere: até 2 MiB, começa
 * com `%PDF-` e tem `%%EOF` no fim. Devolve o conteúdo em Base64.
 */
export async function readInvoicePdf(file: File): Promise<PdfReadResult> {
  if (file.size > INVOICE_PDF_MAX_BYTES) return { error: "tooLarge" };

  let bytes: Uint8Array;
  try {
    bytes = await readBytes(file);
  } catch {
    return { error: "unreadable" };
  }

  const isPdf =
    ascii(bytes.subarray(0, 5)) === "%PDF-" &&
    ascii(bytes.subarray(Math.max(0, bytes.length - EOF_WINDOW))).includes(
      "%%EOF",
    );
  if (!isPdf) return { error: "notPdf" };

  return { base64: toBase64(bytes) };
}
