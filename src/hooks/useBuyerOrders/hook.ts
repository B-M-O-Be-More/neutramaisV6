"use client";

import React from "react";

import { ForbiddenError } from "@/services/errors";
import { ordersService, type ProductOrder } from "@/services/orders.service";

import type { UseBuyerOrdersReturn } from "./interface";

const PAGE_SIZE = 200;
// O upstream não pula mais que 10000 pedidos.
const MAX_OFFSET = 10_000;

/** Lê todas as páginas da lista do Buyer. */
async function fetchAllBuyerOrders(
  signal: AbortSignal,
): Promise<ProductOrder[]> {
  const orders: ProductOrder[] = [];
  for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_SIZE) {
    const { data, metadata } = await ordersService.listBuyerOrders(
      { offset, limit: PAGE_SIZE },
      { signal },
    );
    const page = data ?? [];
    orders.push(...page);
    const total = metadata?.totalCount ?? orders.length;
    if (page.length < PAGE_SIZE || orders.length >= total) break;
  }
  return orders;
}

/**
 * "Meus Pedidos": os pedidos da orders-api em que a organização do perfil
 * Buyer comprou (`order:read`). Sem a permissão, a lista fica vazia com o
 * aviso dela.
 */
export function useBuyerOrders(): UseBuyerOrdersReturn {
  const [orders, setOrders] = React.useState<ProductOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetchAllBuyerOrders(signal)
      .then((list) => {
        if (signal.aborted) return;
        setOrders(list);
        setErrorKey(null);
      })
      .catch((error) => {
        if (signal.aborted) return;
        setOrders([]);
        setErrorKey(
          error instanceof ForbiddenError
            ? "BuyerOrders.errors.forbidden"
            : "BuyerOrders.errors.failed",
        );
      })
      .finally(() => {
        if (!signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = React.useCallback(() => {
    setIsLoading(true);
    setErrorKey(null);
    setAttempt((n) => n + 1);
  }, []);

  return { orders, isLoading, errorKey, reload };
}
