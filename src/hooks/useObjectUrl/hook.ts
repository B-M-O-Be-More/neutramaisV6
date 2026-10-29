"use client";

import React from "react";

/**
 * URL local (`blob:`) para exibir um arquivo escolhido pelo usuário — ex.:
 * prévia de imagem antes do upload. A URL é revogada ao trocar de arquivo ou
 * desmontar, para não vazar memória.
 */
export function useObjectUrl(file: Blob | null | undefined): string | null {
  const url = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  React.useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}
