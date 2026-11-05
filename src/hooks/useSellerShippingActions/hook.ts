"use client";

import React from "react";

import { downloadBlob } from "@/functions/downloadBlob";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  upstreamDetailMessage,
} from "@/services/errors";
import {
  ordersService,
  type AttachInvoiceInput,
  type OrderShipping,
} from "@/services/orders.service";

import type {
  SellerShippingFailure,
  SellerShippingPending,
  SellerShippingResult,
  UseSellerShippingActionsOptions,
  UseSellerShippingActionsReturn,
} from "./interface";

/**
 * Erro da orders-api para a tela. 403: sem `order:accept` ou de outra
 * organização. 409: pagamento não confirmado ou pedido em cancelamento.
 * 422: a API diz o motivo (chave, valor, PDF, rastreio fora de hora).
 */
function failureOf(error: unknown): SellerShippingFailure {
  const detail = upstreamDetailMessage(error);
  if (error instanceof ForbiddenError) {
    return { errorKey: "OrderShipping.errors.forbidden" };
  }
  if (error instanceof NotFoundError) {
    return { errorKey: "OrderShipping.errors.notFound" };
  }
  if (error instanceof ConflictError) {
    return { errorKey: "OrderShipping.errors.conflict", detail };
  }
  if (error instanceof ValidationError) {
    return { errorKey: "OrderShipping.errors.rejected", detail };
  }
  return { errorKey: "OrderShipping.errors.failed" };
}

/**
 * Ações de envio do Seller no detalhe do pedido físico: aceitar, anexar a NF,
 * informar o rastreio e imprimir as etiquetas. Uma ação por vez.
 */
export function useSellerShippingActions({
  orderId,
  onShippingChange,
}: UseSellerShippingActionsOptions): UseSellerShippingActionsReturn {
  const [pending, setPending] = React.useState<SellerShippingPending>(null);

  const run = React.useCallback(
    async (
      key: SellerShippingPending,
      action: () => Promise<OrderShipping | void>,
    ): Promise<SellerShippingResult> => {
      setPending(key);
      try {
        const shipping = await action();
        if (shipping) onShippingChange(shipping);
        return { ok: true };
      } catch (error) {
        return { ok: false, ...failureOf(error) };
      } finally {
        setPending(null);
      }
    },
    [onShippingChange],
  );

  const accept = React.useCallback(
    () => run("accept", () => ordersService.acceptShipping(orderId)),
    [run, orderId],
  );

  const attachInvoice = React.useCallback(
    (input: AttachInvoiceInput) =>
      run("invoice", () => ordersService.attachInvoice(orderId, input)),
    [run, orderId],
  );

  const informTracking = React.useCallback(
    (code: string) =>
      run("tracking", () => ordersService.informTracking(orderId, code)),
    [run, orderId],
  );

  const printLabel = React.useCallback(
    (labelId: string) =>
      run({ label: labelId }, async () => {
        const blob = await ordersService.downloadLabel(orderId, labelId);
        downloadBlob(`etiqueta-${orderId.slice(0, 8)}.pdf`, blob);
      }),
    [run, orderId],
  );

  return { pending, accept, attachInvoice, informTracking, printLabel };
}
