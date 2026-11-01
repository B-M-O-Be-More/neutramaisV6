// Leitura de KMZ no navegador para pré-visualizar a cobertura no mapa antes
// (e independente) da geo-api, que não devolve a geometria das versões.
// Espelha as regras do upstream que dá para checar aqui: um único .kml dentro
// do zip e ao menos uma geometria aceita. A leitura roda num Web Worker
// (`readKmz`, em fluxo), para KMLs de centenas de MB não travarem a tela.

import {
  KmzParseError,
  readKmz,
  type KmzErrorCode,
  type ParsedKmz,
} from "./readKmz";

export {
  KmzParseError,
  PREVIEW_MAX_COORDINATES,
  type KmzErrorCode,
  type ParsedKmz,
} from "./readKmz";

/** Mesmo limite da geo-api (`MAX_KMZ_BYTES`). */
export const MAX_KMZ_BYTES = 50 * 1024 * 1024;

/** Resposta do worker (`src/workers/parseKmz.worker.ts`). */
export type KmzWorkerResponse =
  | { ok: true; parsed: ParsedKmz }
  | { ok: false; code: KmzErrorCode };

function readInWorker(file: File): Promise<ParsedKmz> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/parseKmz.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.addEventListener(
      "message",
      (event: MessageEvent<KmzWorkerResponse>) => {
        worker.terminate();
        if (event.data.ok) resolve(event.data.parsed);
        else reject(new KmzParseError(event.data.code));
      },
    );
    // Worker que não carrega ou morre (memória): envia sem a pré-visualização
    // — a geo-api valida o arquivo de qualquer forma.
    worker.addEventListener("error", () => {
      worker.terminate();
      resolve({ geometry: null });
    });
    worker.postMessage(file);
  });
}

/**
 * Lê um .kmz e devolve a geometria em GeoJSON com as contagens. Lança
 * `KmzParseError` com o motivo quando o arquivo não serve.
 */
export async function parseKmz(file: File): Promise<ParsedKmz> {
  if (!file.name.toLowerCase().endsWith(".kmz")) {
    throw new KmzParseError("invalidExtension");
  }
  if (file.size === 0 || file.size > MAX_KMZ_BYTES) {
    throw new KmzParseError("tooLarge");
  }

  return typeof Worker === "undefined" ? readKmz(file) : readInWorker(file);
}
