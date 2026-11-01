"use client";

import React from "react";

import { AuthError, ForbiddenError } from "@/services/errors";
import {
  walletService,
  type WalletTransaction,
} from "@/services/wallet.service";

import type {
  UseWalletTransactionsOptions,
  UseWalletTransactionsReturn,
} from "./interface";

/** Páginas carregadas, marcadas com a consulta que as originou. */
interface StatementResult {
  key: string;
  items: WalletTransaction[];
  nextCursor: string | null;
  error: string | null;
}

/**
 * Extrato da carteira (wallet-api), do lançamento mais novo ao mais antigo.
 * A primeira página carrega sozinha; `loadMore` segue o cursor e acrescenta
 * os lançamentos mais antigos.
 */
export function useWalletTransactions({
  currency = "BRL",
  limit = 25,
}: UseWalletTransactionsOptions = {}): UseWalletTransactionsReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<StatementResult | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const requestKey = `${currency}#${limit}#${attempt}`;
  // A página extra só entra se a consulta ainda for a mesma quando voltar.
  const currentKey = React.useRef(requestKey);

  React.useEffect(() => {
    currentKey.current = requestKey;
    const controller = new AbortController();

    walletService
      .listTransactions({ currency, limit }, { signal: controller.signal })
      .then((statement) =>
        setResult({
          key: requestKey,
          items: statement?.items ?? [],
          nextCursor: statement?.nextCursor ?? null,
          error: null,
        }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          items: [],
          nextCursor: null,
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "Wallet.errors.forbidden"
              : "Wallet.errors.transactionsFailed",
        });
      });

    return () => controller.abort();
  }, [currency, limit, requestKey]);

  const isCurrent = result?.key === requestKey;
  const cursor = isCurrent ? result.nextCursor : null;

  const loadMore = React.useCallback(() => {
    if (!cursor || isLoadingMore) return;
    const key = requestKey;
    setIsLoadingMore(true);

    walletService
      .listTransactions({ currency, limit, cursor })
      .then((statement) => {
        if (currentKey.current !== key) return;
        setResult((previous) =>
          previous && previous.key === key
            ? {
                ...previous,
                items: [...previous.items, ...(statement?.items ?? [])],
                nextCursor: statement?.nextCursor ?? null,
              }
            : previous,
        );
      })
      // Falha ao continuar mantém o que já foi carregado; o botão segue ali.
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false));
  }, [currency, cursor, isLoadingMore, limit, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  return {
    transactions: isCurrent ? result.items : [],
    isLoading: !isCurrent,
    isLoadingMore,
    error: isCurrent ? result.error : null,
    hasMore: !!cursor,
    loadMore,
    reload,
  };
}
