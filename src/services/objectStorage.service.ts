// Envio direto ao storage de objetos (S3-compatível; MinIO na homologação).
// Exceção ao BFF (ADR-002): os bytes vão do browser direto para a URL que a
// API assinou, sem passar pelo Next. Nenhum token da aplicação vai junto — a
// autorização está nos `fields` assinados, que valem por poucos minutos.

import type { SignedFormUpload } from "./productCatalog.service";
import { apiErrorFromResponse, NetworkError, TimeoutError } from "./errors";

// Arquivos de até 5 MB: o timeout padrão do cliente (30s) é curto demais.
const UPLOAD_TIMEOUT_MS = 120_000;

export const objectStorageService = {
  /**
   * `POST` multipart no formulário assinado: os `fields` na ordem recebida e
   * o arquivo por ÚLTIMO, no campo `file` (o storage ignora o que vem depois
   * dele). Sucesso não tem corpo útil; quem confirma é a API.
   */
  uploadToSignedForm: async (upload: SignedFormUpload, file: File) => {
    const form = new FormData();
    for (const [name, value] of Object.entries(upload.fields)) {
      form.append(name, value);
    }
    form.append("file", file);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(upload.url, {
        method: "POST",
        body: form,
        credentials: "omit",
        signal: controller.signal,
      });
    } catch (error) {
      throw controller.signal.aborted
        ? new TimeoutError("O envio da imagem expirou.", { cause: error })
        : new NetworkError("Falha ao enviar a imagem ao storage.", {
            cause: error,
          });
    } finally {
      clearTimeout(timeout);
    }

    // O storage responde em XML: só o status interessa (403 = assinatura
    // vencida ou arquivo fora do tamanho autorizado).
    if (!response.ok) throw apiErrorFromResponse(response.status);
  },
};
