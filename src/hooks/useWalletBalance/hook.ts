"use client";

import React from "react";

import { AuthError, ForbiddenError } from "@/services/errors";
import {
  walletService,
  type WalletBalance,
  type WalletCurrency,
} from "@/services/wallet.service";

import type { UseWalletBalanceReturn } from "./interface";

/** Última resposta recebida, marcada com a consulta que a originou. */
interface BalanceResult {
  key: string;
  balance: WalletBalance | null;
  error: string | null;
}

/** Saldo da carteira da organização (wallet-api), na moeda pedida. */
export function useWalletBalance(
  currency: WalletCurrency = "BRL",
): UseWalletBalanceReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<BalanceResult | null>(null);

  const requestKey = `${currency}#${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();

    walletService
      .getBalance(currency, { signal: controller.signal })
      .then((balance) =>
        setResult({ key: requestKey, balance: balance ?? null, error: null }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          balance: null,
          error:
            error instanceof AuthError || error instanceof ForbiddenError
              ? "Wallet.errors.forbidden"
              : "Wallet.errors.balanceFailed",
        });
      });

    return () => controller.abort();
  }, [currency, requestKey]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);

  const isCurrent = result?.key === requestKey;

  return {
    balance: isCurrent ? result.balance : null,
    isLoading: !isCurrent,
    error: isCurrent ? result.error : null,
    reload,
  };
}
