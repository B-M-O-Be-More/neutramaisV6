"use client";

import React from "react";

import { orderHasPhysicalItems } from "@/functions/orderStage";
import {
  summarizeSellerOrders,
  type SellerOrderShippings,
} from "@/functions/sellerOrderSummary";
import { ConflictError, ForbiddenError } from "@/services/errors";
import {
  isCheckoutOrder,
  ordersService,
  type ProductOrder,
} from "@/services/orders.service";

import type {
  SellerOrderAcceptResult,
  UseSellerOrdersReturn,
} from "./interface";

const PAGE_SIZE = 200;
// O upstream não pula mais que 10000 pedidos.
const MAX_OFFSET = 10_000;

/** Lê todas as páginas da lista do Seller. */
async function fetchAllSellerOrders(
  signal: AbortSignal,
): Promise<ProductOrder[]> {
  const orders: ProductOrder[] = [];
  for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_SIZE) {
    const { data, metadata } = await ordersService.listSellerOrders(
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
 * Envio dos pedidos físicos pagos: é ele que diz se o Seller já aceitou. Uma
 * leitura que falha deixa o pedido de fora (conta como aceito).
 */
async function fetchShippings(
  orders: ProductOrder[],
  signal: AbortSignal,
): Promise<SellerOrderShippings> {
  const paidPhysical = orders.filter(
    (order) =>
      isCheckoutOrder(order) &&
      order.status === "accepted" &&
      orderHasPhysicalItems(order),
  );
  const results = await Promise.allSettled(
    paidPhysical.map((order) =>
      ordersService.getShipping(order.id, { signal }),
    ),
  );
  const shippings: SellerOrderShippings = {};
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      shippings[paidPhysical[index].id] = result.value;
    }
  });
  return shippings;
}

/**
 * Caixa de entrada do seller: os pedidos da orders-api (perfil Seller, com
 * `order:read`), o envio dos físicos pagos e o resumo dos contadores. Sem a
 * permissão, a lista fica vazia com o aviso dela.
 */
export function useSellerOrders(): UseSellerOrdersReturn {
  const [orders, setOrders] = React.useState<ProductOrder[]>([]);
  const [shippings, setShippings] = React.useState<SellerOrderShippings>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetchAllSellerOrders(signal)
      .then(async (list) => {
        const shippingList = await fetchShippings(list, signal);
        if (signal.aborted) return;
        setOrders(list);
        setShippings(shippingList);
        setErrorKey(null);
      })
      .catch((error) => {
        if (signal.aborted) return;
        setOrders([]);
        setShippings({});
        setErrorKey(
          error instanceof ForbiddenError
            ? "SellerOrders.errors.forbidden"
            : "SellerOrders.errors.failed",
        );
      })
      .finally(() => {
        if (!signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const summary = React.useMemo(
    () => summarizeSellerOrders(orders, new Date(), shippings),
    [orders, shippings],
  );
  const reload = React.useCallback(() => {
    setIsLoading(true);
    setErrorKey(null);
    setAttempt((n) => n + 1);
  }, []);

  const accept = React.useCallback(
    async (orderId: string): Promise<SellerOrderAcceptResult> => {
      setPendingId(orderId);
      try {
        const shipping = await ordersService.acceptShipping(orderId);
        setShippings((current) => ({ ...current, [orderId]: shipping }));
        return "accepted";
      } catch (error) {
        if (error instanceof ForbiddenError) return "forbidden";
        if (error instanceof ConflictError) return "conflict";
        return "failed";
      } finally {
        setPendingId(null);
      }
    },
    [],
  );

  return {
    orders,
    shippings,
    ...summary,
    criticalSla: 0,
    isLoading,
    errorKey,
    reload,
    pendingId,
    accept,
  };
}
