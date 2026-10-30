// Service da carteira (wallet-api).
// Segue o padrão do SDD §12.2: funções nomeadas por operação, sem React, sem
// tratamento de erro (propaga AppError tipado para o hook chamador).
// O browser fala com o BFF (`/api/wallet/*`), que anexa o Bearer do cookie.
//
// Valores sempre em unidades mínimas (centavos) e inteiros. A carteira guarda
// o crédito Neutra+ da organização (gerado em cancelamentos) e o consumo dele
// em checkouts.

import { api } from "./api.client";

export type WalletCurrency = "BRL" | "USD" | "EUR";

/** Saldo da organização do token — `GET /wallet/balance`. */
export interface WalletBalance {
  organizationId: string;
  currency: WalletCurrency;
  /** Livre para usar em checkouts. */
  availableMinor: number;
  /** Reservado por checkouts ainda não concluídos. */
  reservedMinor: number;
}

/** Lançamento do ledger (imutável). */
export interface WalletTransaction {
  id: string;
  /** credit: crédito por cancelamento; debit: uso do saldo num checkout. */
  kind: "credit" | "debit";
  currency: WalletCurrency;
  /** Sempre positivo — o sinal vem de `kind`. */
  amountMinor: number;
  orderId: string;
  paymentId: string;
  allocationId: string;
  /** Presente nos créditos gerados por cancelamento. */
  cancellationId: string | null;
  externalPaidMinor: number;
  walletPaidMinor: number;
  /** Epoch em segundos. */
  createdAt: number;
}

/** Página do extrato — `GET /wallet/transactions`. */
export interface WalletStatement {
  items: WalletTransaction[];
  /** Continua a listagem (exclusivo); null na última página. */
  nextCursor: string | null;
}

export interface ListWalletTransactionsParams {
  currency?: WalletCurrency;
  /** 1–100 (default 25 no upstream). */
  limit?: number;
  cursor?: string;
}

export const walletService = {
  /** Saldo. 403 sem a permissão `wallet:read`. */
  getBalance: (
    currency: WalletCurrency = "BRL",
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<WalletBalance>("/wallet/balance", {
      params: { currency },
      signal: options.signal,
    }),

  /** Extrato, do lançamento mais novo ao mais antigo. */
  listTransactions: (
    params: ListWalletTransactionsParams = {},
    options: { signal?: AbortSignal } = {},
  ) =>
    api.get<WalletStatement>("/wallet/transactions", {
      params: { currency: "BRL", ...params },
      signal: options.signal,
    }),
};
