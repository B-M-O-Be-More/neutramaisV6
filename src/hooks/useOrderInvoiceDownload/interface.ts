export interface UseOrderInvoiceDownloadReturn {
  isDownloading: boolean;
  /** Baixa o PDF da NF do pedido; devolve a chave i18n do erro, ou null. */
  download: (orderId: string) => Promise<string | null>;
}
