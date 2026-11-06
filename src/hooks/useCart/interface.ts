import type { CartEntry } from "@/functions/cartStorage";

export type { CartEntry };

export interface UseCartReturn {
  /** Itens na ordem em que entraram. */
  entries: CartEntry[];
  /** Põe a oferta no carrinho (1 unidade); já presente, não muda nada. */
  add: (offeringId: string) => void;
  setQuantity: (offeringId: string, quantity: number) => void;
  remove: (offeringId: string) => void;
  /** Esvazia o carrinho (depois que o checkout gravou os pedidos). */
  clear: () => void;
}
