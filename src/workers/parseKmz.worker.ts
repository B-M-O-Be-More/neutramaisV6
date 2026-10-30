// Web Worker da leitura de KMZ (`parseKmz`): descompactar e varrer centenas
// de MB de KML fora da thread da tela.

import { KmzParseError, readKmz } from "@/functions/readKmz";

import type { KmzWorkerResponse } from "@/functions/parseKmz";

const scope = self as unknown as {
  setImmediate?: (callback: () => void) => void;
  postMessage(message: KmzWorkerResponse): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<Blob>) => void,
  ): void;
};

// O JSZip agenda cada bloco com o polyfill `setimmediate`, que num worker de
// módulo cai no `postMessage(msg, "*")` da janela e quebra. Com
// `setImmediate` já definido, o polyfill não se instala.
if (!scope.setImmediate) {
  const queue: (() => void)[] = [];
  const channel = new MessageChannel();
  channel.port1.onmessage = () => queue.shift()?.();
  scope.setImmediate = (callback) => {
    queue.push(callback);
    channel.port2.postMessage(null);
  };
}

scope.addEventListener("message", async (event) => {
  try {
    scope.postMessage({ ok: true, parsed: await readKmz(event.data) });
  } catch (error) {
    scope.postMessage({
      ok: false,
      code: error instanceof KmzParseError ? error.code : "invalidArchive",
    });
  }
});
