"use client";

import React from "react";

import { api } from "@/services/api.client";
import type { PaginationMetadata } from "@/types/api.types";
import { useLoading } from "../useLoading/hook";
import { FetchResponse, Options } from "./interface";

/**
 * Hook de conveniência para consumo do BFF a partir de componentes client.
 * Delega ao `api.client` (base `/api`), expondo estado de loading, o último
 * `data` e a paginação do envelope. Erros são propagados como AppError tipados
 * (ver services/errors.ts) — trate-os no hook de feature, não no componente.
 */
export default function useFetch<T>() {
  const [data, setData] = React.useState<T>();
  const [pagination, setPagination] = React.useState<PaginationMetadata | null>(
    null,
  );
  const { executeWithLoading, isLoading } = useLoading();

  const request = React.useCallback(
    async (url: string, options: Options): Promise<FetchResponse<T>> => {
      const result = await executeWithLoading(() =>
        api.request<T>(options.method, url, options.body ?? null, {
          params: options.params,
          headers: options.headers,
        }),
      );

      setData(result.data);
      setPagination(result.metadata);

      return { data: result.data, message: result.message };
    },
    [executeWithLoading],
  );

  return [request, isLoading, data, pagination] as const;
}
