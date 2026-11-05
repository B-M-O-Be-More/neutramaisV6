import type {
  CreateOfferingPriceInput,
  OfferingPrice,
  UpdateOfferingPriceInput,
} from "@/services/offeringPrices.service";

export interface UseOfferingPricesReturn {
  /** Preços lidos (ativos, ou todos com o histórico). */
  prices: OfferingPrice[];
  isLoading: boolean;
  /** Chave de tradução da falha ao ler. */
  loadErrorKey?: string;
  reload: () => void;
  /** Ação em andamento: "create" ou o id do preço alterado/encerrado. */
  pendingId: string | null;
  /** Chave de tradução da falha da última ação. */
  actionErrorKey?: string;
  /** Cada ação devolve true quando gravou. */
  create: (input: CreateOfferingPriceInput) => Promise<boolean>;
  update: (
    priceId: string,
    input: UpdateOfferingPriceInput,
  ) => Promise<boolean>;
  end: (priceId: string) => Promise<boolean>;
}
