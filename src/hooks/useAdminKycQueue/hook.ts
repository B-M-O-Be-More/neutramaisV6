"use client";

import React from "react";

import {
  adminService,
  type KycQueueIndicators,
  type KycQueueItem,
  type KycQueueParams,
} from "@/services/admin.service";
import { AuthError, ForbiddenError } from "@/services/errors";

import type {
  AdminKycQueueError,
  AdminKycQueueFilters,
  UseAdminKycQueueReturn,
} from "./interface";

export const ADMIN_KYC_QUEUE_PAGE_SIZE = 50;

function toError(error: unknown): AdminKycQueueError {
  return error instanceof AuthError || error instanceof ForbiddenError
    ? "forbidden"
    : "failed";
}

// Filtros da tela → query do upstream, sem os vazios.
function toParams(filters: AdminKycQueueFilters): KycQueueParams {
  const search = filters.search.trim();
  return {
    ...(search ? { search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
  };
}

/** Última resposta recebida, marcada com a consulta que a originou. */
interface QueueResult {
  key: string;
  items: KycQueueItem[];
  total: number;
  error: AdminKycQueueError | null;
}

/**
 * Fila de KYC do admin (`GET /admin/kyc/queue`), paginada de 50 em 50. Trocar
 * qualquer filtro recomeça do zero; `loadMore` acrescenta a página seguinte.
 * Requisições em voo são canceladas ao trocar de filtro ou desmontar.
 *
 * Os indicadores ficam com o último valor recebido, para os cards não voltarem
 * a "—" a cada troca de filtro.
 */
export function useAdminKycQueue(
  filters: AdminKycQueueFilters,
): UseAdminKycQueueReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<QueueResult | null>(null);
  const [indicators, setIndicators] = React.useState<KycQueueIndicators | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Serializa os filtros para o efeito não disparar a cada render quando o
  // chamador passa um objeto literal.
  const paramsKey = JSON.stringify(toParams(filters));
  const requestKey = `${paramsKey}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    const params = JSON.parse(paramsKey) as KycQueueParams;

    adminService
      .getKycQueue(
        { ...params, limit: ADMIN_KYC_QUEUE_PAGE_SIZE, offset: 0 },
        { signal: controller.signal },
      )
      .then((queue) => {
        setResult({
          key: requestKey,
          items: queue?.items ?? [],
          total: queue?.total ?? 0,
          error: null,
        });
        if (queue?.indicators) setIndicators(queue.indicators);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          items: [],
          total: 0,
          error: toError(error),
        });
      });

    return () => controller.abort();
  }, [paramsKey, requestKey]);

  const isCurrent = result?.key === requestKey;

  const loadMore = React.useCallback(() => {
    if (!result || result.key !== requestKey || isLoadingMore) return;
    if (result.items.length >= result.total) return;

    setIsLoadingMore(true);
    adminService
      .getKycQueue({
        ...(JSON.parse(paramsKey) as KycQueueParams),
        limit: ADMIN_KYC_QUEUE_PAGE_SIZE,
        offset: result.items.length,
      })
      .then((queue) =>
        setResult((current) =>
          current?.key === requestKey
            ? {
                ...current,
                items: [...current.items, ...(queue?.items ?? [])],
                total: queue?.total ?? current.total,
              }
            : current,
        ),
      )
      .catch((error) =>
        setResult((current) =>
          current?.key === requestKey
            ? { ...current, error: toError(error) }
            : current,
        ),
      )
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, paramsKey, requestKey, result]);

  const refetch = React.useCallback(() => setAttempt((n) => n + 1), []);

  return {
    items: isCurrent ? result.items : [],
    total: isCurrent ? result.total : 0,
    indicators,
    isLoading: !isCurrent,
    isLoadingMore,
    error: isCurrent ? result.error : null,
    loadMore,
    refetch,
  };
}
