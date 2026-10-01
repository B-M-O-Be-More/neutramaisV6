"use client";

import React from "react";

import type { CopyStatus } from "./interface";

// Tempo que o feedback ("Copiado!") permanece visível.
const FEEDBACK_MS = 2500;

/**
 * Copia texto para a área de transferência e expõe o status para feedback
 * visual/leitor de tela. Falha (permissão negada, contexto inseguro) vira
 * `failed` — a tela orienta a copiar manualmente.
 */
export function useCopyToClipboard() {
  const [status, setStatus] = React.useState<CopyStatus>("idle");
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const copy = React.useCallback(async (text: string) => {
    let next: CopyStatus = "copied";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      next = "failed";
    }
    setStatus(next);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  }, []);

  return { status, copy };
}
