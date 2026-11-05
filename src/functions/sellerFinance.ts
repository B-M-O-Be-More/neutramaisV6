import type {
  SellerReceivable,
  ShippingCostDebt,
} from "@/services/sellerPayout.service";

export interface ReceivablesSummary {
  /** Líquido ainda fora de lote de repasse (pedidos não cancelados). */
  toReceiveMinor: number;
  /** Pedidos que compõem o valor a receber. */
  toReceiveOrders: number;
  /** Retenção da plataforma nos pedidos não cancelados. */
  feesMinor: number;
}

/**
 * "Saldo a Receber" e "Taxas Deduzidas" da carteira do seller, na moeda
 * pedida: o a receber é o líquido que ainda não entrou em lote de repasse.
 */
export function summarizeReceivables(
  receivables: SellerReceivable[],
  currency: string,
): ReceivablesSummary {
  return receivables
    .filter((item) => item.currency === currency && !item.cancellationId)
    .reduce<ReceivablesSummary>(
      (summary, item) => {
        summary.feesMinor += item.feeMinor;
        if (!item.batchId) {
          summary.toReceiveMinor += item.netMinor;
          summary.toReceiveOrders += 1;
        }
        return summary;
      },
      { toReceiveMinor: 0, toReceiveOrders: 0, feesMinor: 0 },
    );
}

/** Total das dívidas de frete na moeda pedida. */
export function totalShippingDebt(
  debts: ShippingCostDebt[],
  currency: string,
): number {
  return debts
    .filter((debt) => debt.currency === currency)
    .reduce((sum, debt) => sum + debt.amountMinor, 0);
}
