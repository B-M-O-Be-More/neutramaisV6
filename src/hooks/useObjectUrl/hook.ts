"use client";

import React from "react";

interface ObjectUrlEntry {
  url: string;
  /** Componentes montados usando a URL. */
  users: number;
  revokeTimer?: ReturnType<typeof setTimeout>;
}

// Uma URL por arquivo, compartilhada (ex.: miniatura e preview da mesma foto).
const entries = new WeakMap<Blob, ObjectUrlEntry>();

function entryFor(file: Blob): ObjectUrlEntry {
  let entry = entries.get(file);
  if (!entry) {
    entry = { url: URL.createObjectURL(file), users: 0 };
    entries.set(file, entry);
  }
  return entry;
}

/**
 * URL local (`blob:`) para exibir um arquivo escolhido pelo usuário — ex.:
 * prévia de imagem antes do upload. A URL é revogada quando nenhum
 * componente usa mais o arquivo, para não vazar memória.
 *
 * A revogação é adiada: no StrictMode (dev) o efeito monta, desmonta e monta
 * de novo; revogar na hora deixaria na tela uma URL morta (prévia quebrada).
 */
export function useObjectUrl(file: Blob | null | undefined): string | null {
  const url = file ? entryFor(file).url : null;

  React.useEffect(() => {
    if (!file) return;
    const entry = entryFor(file);
    clearTimeout(entry.revokeTimer);
    entry.users += 1;
    return () => {
      entry.users -= 1;
      if (entry.users > 0) return;
      entry.revokeTimer = setTimeout(() => {
        if (entry.users > 0) return;
        URL.revokeObjectURL(entry.url);
        entries.delete(file);
      }, 0);
    };
  }, [file]);

  return url;
}
