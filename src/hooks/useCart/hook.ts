"use client";

import React from "react";

import {
  CART_MAX_QUANTITY,
  readCart,
  saveCart,
  serverCart,
  subscribeCart,
} from "@/functions/cartStorage";

import type { UseCartReturn } from "./interface";

/** Carrinho da organização, lembrado neste navegador (ver cartStorage). */
export function useCart(organizationId: string): UseCartReturn {
  const entries = React.useSyncExternalStore(
    subscribeCart,
    () => readCart(organizationId),
    serverCart,
  );

  const add = React.useCallback(
    (offeringId: string) => {
      const current = readCart(organizationId);
      if (current.some((entry) => entry.offeringId === offeringId)) return;
      saveCart(organizationId, [...current, { offeringId, quantity: 1 }]);
    },
    [organizationId],
  );

  const setQuantity = React.useCallback(
    (offeringId: string, quantity: number) => {
      const clamped = Math.min(CART_MAX_QUANTITY, Math.max(1, quantity));
      saveCart(
        organizationId,
        readCart(organizationId).map((entry) =>
          entry.offeringId === offeringId
            ? { ...entry, quantity: clamped }
            : entry,
        ),
      );
    },
    [organizationId],
  );

  const remove = React.useCallback(
    (offeringId: string) => {
      saveCart(
        organizationId,
        readCart(organizationId).filter(
          (entry) => entry.offeringId !== offeringId,
        ),
      );
    },
    [organizationId],
  );

  const clear = React.useCallback(
    () => saveCart(organizationId, []),
    [organizationId],
  );

  return { entries, add, setQuantity, remove, clear };
}
