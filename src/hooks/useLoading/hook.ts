"use client";

import React from "react";

export function useLoading() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Memoizado para manter identidade estável — permite que consumidores (ex.:
  // useFetch) exponham um `request` estável usável como dependência de efeito.
  const executeWithLoading = React.useCallback(
    async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await asyncFunction();
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, executeWithLoading };
}
