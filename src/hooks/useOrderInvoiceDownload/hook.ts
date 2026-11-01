"use client";

import React from "react";

import { downloadBlob } from "@/functions/downloadBlob";
import { NotFoundError } from "@/services/errors";
import { ordersService } from "@/services/orders.service";

import type { UseOrderInvoiceDownloadReturn } from "./interface";

/** Download do PDF da nota fiscal anexada ao pedido físico. */
export function useOrderInvoiceDownload(): UseOrderInvoiceDownloadReturn {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const download = React.useCallback(async (orderId: string) => {
    setIsDownloading(true);
    try {
      const blob = await ordersService.downloadInvoice(orderId);
      downloadBlob(`nota-fiscal-${orderId.slice(0, 8)}.pdf`, blob);
      return null;
    } catch (error) {
      return error instanceof NotFoundError
        ? "OrderDetail.errors.invoiceMissing"
        : "OrderDetail.errors.invoiceFailed";
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { isDownloading, download };
}
