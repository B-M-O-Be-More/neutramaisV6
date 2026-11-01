"use client";

import React from "react";

import { orderHasPhysicalItems } from "@/functions/orderStage";
import { ForbiddenError, NotFoundError } from "@/services/errors";
import {
  ordersService,
  type OrderShipping,
  type ProductOrder,
} from "@/services/orders.service";

import type { UseOrderDetailReturn } from "./interface";

function errorKeyOf(error: unknown): string {
  if (error instanceof NotFoundError) return "OrderDetail.errors.notFound";
  if (error instanceof ForbiddenError) return "OrderDetail.errors.forbidden";
  return "OrderDetail.errors.failed";
}

/**
 * Pedido da orders-api, lido com o perfil da página (Buyer ou Seller). Com
 * produto físico, lê também o envio; sem ele a tela só perde a NF.
 */
export function useOrderDetail(orderId: string): UseOrderDetailReturn {
  const [order, setOrder] = React.useState<ProductOrder | null>(null);
  const [shipping, setShipping] = React.useState<OrderShipping | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        const current = await ordersService.getOrder(orderId, { signal });
        const currentShipping = orderHasPhysicalItems(current)
          ? await ordersService
              .getShipping(orderId, { signal })
              .catch(() => null)
          : null;
        if (signal.aborted) return;
        setOrder(current);
        setShipping(currentShipping);
        setErrorKey(null);
      } catch (error) {
        if (signal.aborted) return;
        setOrder(null);
        setErrorKey(errorKeyOf(error));
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [orderId, attempt]);

  const reload = React.useCallback(() => {
    setIsLoading(true);
    setErrorKey(null);
    setAttempt((n) => n + 1);
  }, []);

  return { order, shipping, isLoading, errorKey, reload };
}
