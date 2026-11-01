"use client";

import React from "react";

import { AuthError, ForbiddenError } from "@/services/errors";
import {
  sellerPayoutService,
  type SellerReceivable,
  type ShippingCostDebt,
} from "@/services/sellerPayout.service";

import type { UseSellerFinanceReturn } from "./interface";

/** Última resposta recebida, marcada com a consulta que a originou. */
interface FinanceResult {
  key: number;
  receivables: SellerReceivable[] | null;
  receivablesError: string | null;
  debts: ShippingCostDebt[] | null;
}

/**
 * Recebíveis e dívidas de frete do seller (payment-api), lidos juntos: uma
 * falha numa fonte não esconde a outra. A dívida que falha só deixa de
 * aparecer — o aviso é informativo. Com `enabled` false (carteira do
 * buyer), não consulta.
 */
export function useSellerFinance(enabled = true): UseSellerFinanceReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<FinanceResult | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const { signal } = controller;

    Promise.allSettled([
      sellerPayoutService.listReceivables({ signal }),
      sellerPayoutService.listShippingCostDebts({ signal }),
    ]).then(([receivables, debts]) => {
      if (signal.aborted) return;
      setResult({
        key: attempt,
        receivables:
          receivables.status === "fulfilled" ? (receivables.value ?? []) : null,
        receivablesError:
          receivables.status === "fulfilled"
            ? null
            : receivables.reason instanceof AuthError ||
                receivables.reason instanceof ForbiddenError
              ? "Wallet.seller.errors.receivablesForbidden"
              : "Wallet.seller.errors.receivablesFailed",
        debts: debts.status === "fulfilled" ? (debts.value ?? []) : null,
      });
    });

    return () => controller.abort();
  }, [enabled, attempt]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);
  const current = enabled && result?.key === attempt ? result : null;

  return {
    receivables: current?.receivables ?? null,
    receivablesError: current?.receivablesError ?? null,
    debts: current?.debts ?? null,
    isLoading: enabled && !current,
    reload,
  };
}
