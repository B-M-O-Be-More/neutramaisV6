import type {
  SellerReceivable,
  ShippingCostDebt,
} from "@/services/sellerPayout.service";

export interface UseSellerFinanceReturn {
  /** Recebíveis; null enquanto carrega ou em erro. */
  receivables: SellerReceivable[] | null;
  /** Chave de tradução quando os recebíveis não carregaram. */
  receivablesError: string | null;
  /** Dívidas de frete; null enquanto carrega ou em erro. */
  debts: ShippingCostDebt[] | null;
  isLoading: boolean;
  reload: () => void;
}
