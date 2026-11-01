"use client";

import React from "react";

import { checkoutSnapshotService } from "@/services/checkoutSnapshot.service";
import { ForbiddenError, NotFoundError } from "@/services/errors";

import type {
  CartOffering,
  CartOfferingStatus,
  UseCartOfferingsReturn,
} from "./interface";

function statusOf(error: unknown): CartOfferingStatus {
  if (error instanceof NotFoundError) return "unavailable";
  if (error instanceof ForbiddenError) return "ownOffer";
  return "failed";
}

/**
 * Snapshot de checkout de cada oferta do carrinho. Lê só as que ainda não
 * foram lidas (mudar a quantidade não refaz a leitura); `retry` relê as que
 * falharam.
 */
export function useCartOfferings(
  offeringIds: string[],
): UseCartOfferingsReturn {
  const [offerings, setOfferings] = React.useState<Map<string, CartOffering>>(
    () => new Map(),
  );
  // Pedidas (em voo ou lidas) e as que já têm resposta.
  const requested = React.useRef(new Set<string>());
  const settled = React.useRef(new Set<string>());
  const [attempt, setAttempt] = React.useState(0);

  const idsKey = offeringIds.join(",");

  React.useEffect(() => {
    const controller = new AbortController();
    const requestedIds = requested.current;
    const settledIds = settled.current;
    const pending = idsKey
      .split(",")
      .filter((id) => id && !requestedIds.has(id));

    for (const offeringId of pending) {
      requestedIds.add(offeringId);
      const settle = (offering: CartOffering) => {
        if (controller.signal.aborted) return;
        settledIds.add(offeringId);
        setOfferings((current) => new Map(current).set(offeringId, offering));
      };
      checkoutSnapshotService
        .get(offeringId, { signal: controller.signal })
        .then((snapshot) => settle({ status: "ready", snapshot }))
        .catch((error) => settle({ status: statusOf(error), snapshot: null }));
    }

    // Desmontou ou a lista mudou no meio: libera o que não terminou.
    return () => {
      controller.abort();
      for (const offeringId of pending) {
        if (!settledIds.has(offeringId)) requestedIds.delete(offeringId);
      }
    };
  }, [idsKey, attempt]);

  const retry = React.useCallback(() => {
    setOfferings((current) => {
      const next = new Map(current);
      for (const [offeringId, offering] of current) {
        if (offering.status !== "failed") continue;
        next.delete(offeringId);
        requested.current.delete(offeringId);
        settled.current.delete(offeringId);
      }
      return next;
    });
    setAttempt((n) => n + 1);
  }, []);

  return { offerings, retry };
}
