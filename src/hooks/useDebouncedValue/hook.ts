"use client";

import React from "react";

/**
 * Devolve `value` só depois de `delayMs` sem mudanças — para não disparar uma
 * consulta à API a cada tecla digitada numa busca.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
