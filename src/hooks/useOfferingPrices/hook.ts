"use client";

import React from "react";

import { ForbiddenError, upstreamErrorCode } from "@/services/errors";
import {
  offeringPricesService,
  type CreateOfferingPriceInput,
  type OfferingPrice,
  type UpdateOfferingPriceInput,
} from "@/services/offeringPrices.service";

import type { UseOfferingPricesReturn } from "./interface";

// Recusas da marketplace-api → mensagens (o seller precisa saber o que
// ajustar na faixa ou no valor).
const ERROR_KEYS: Record<string, string> = {
  MKT_PRICE_TIER_OVERLAP: "SellerOfferPrices.errors.overlap",
  MKT_OFFER_CURRENCY_MISMATCH: "SellerOfferPrices.errors.currencyMismatch",
  MKT_CURRENCY_NOT_SUPPORTED: "SellerOfferPrices.errors.currencyMismatch",
  MKT_PRICE_INVALID: "SellerOfferPrices.errors.invalid",
  MKT_OFFER_PRICE_REQUIRED: "SellerOfferPrices.errors.priceRequired",
  MKT_OFFER_ARCHIVED: "SellerOfferEdit.errors.readOnly",
  MKT_PERMISSION_REQUIRED: "SellerOfferPrices.errors.permission",
};

function actionErrorKey(error: unknown): string {
  const code = upstreamErrorCode(error);
  if (code && ERROR_KEYS[code]) return ERROR_KEYS[code];
  if (error instanceof ForbiddenError) {
    return "SellerOfferPrices.errors.permission";
  }
  return "SellerOfferPrices.errors.failed";
}

/** Última leitura, marcada com a tentativa que a originou. */
interface PricesResult {
  key: string;
  prices: OfferingPrice[];
  hasError: boolean;
}

/**
 * Preços da oferta (D-20): lista os ativos ou o histórico e adiciona,
 * altera ou encerra um preço. Depois de cada gravação a lista é relida e
 * `onChanged` avisa quem mostra a oferta (o preço mensal projetado muda).
 */
export function useOfferingPrices(
  offeringId: string,
  { history, onChanged }: { history: boolean; onChanged?: () => void },
): UseOfferingPricesReturn {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<PricesResult | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errorKey, setErrorKey] = React.useState<string>();
  const key = `${offeringId}:${history}:${attempt}`;

  React.useEffect(() => {
    const controller = new AbortController();
    offeringPricesService
      .list(offeringId, { history, signal: controller.signal })
      .then((prices) =>
        setResult({ key, prices: prices ?? [], hasError: false }),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key, prices: [], hasError: true });
      });
    return () => controller.abort();
  }, [offeringId, history, key]);

  const current = result?.key === key ? result : null;

  const run = async (id: string, call: () => Promise<unknown>) => {
    setPendingId(id);
    setErrorKey(undefined);
    try {
      await call();
      setAttempt((n) => n + 1);
      onChanged?.();
      return true;
    } catch (error) {
      setErrorKey(actionErrorKey(error));
      return false;
    } finally {
      setPendingId(null);
    }
  };

  return {
    // Mantém a lista anterior enquanto relê.
    prices: result?.prices ?? [],
    isLoading: !current,
    loadErrorKey: current?.hasError
      ? "SellerOfferPrices.errors.loadFailed"
      : undefined,
    reload: () => setAttempt((n) => n + 1),
    pendingId,
    actionErrorKey: errorKey,
    create: (input: CreateOfferingPriceInput) =>
      run("create", () => offeringPricesService.create(offeringId, input)),
    update: (priceId: string, input: UpdateOfferingPriceInput) =>
      run(priceId, () =>
        offeringPricesService.update(offeringId, priceId, input),
      ),
    end: (priceId: string) =>
      run(priceId, () => offeringPricesService.end(offeringId, priceId)),
  };
}
