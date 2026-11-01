import type { ReactNode } from "react";

import type {
  ReturnableOrder,
  ReturnRequest,
  ReturnRequestDraft,
  ReturnsSummary,
} from "@/types/returns";

export interface ReturnsContextProps {
  returns: ReturnRequest[];
  summary: ReturnsSummary;
  /** Pedidos entregues que aceitam devolução. */
  returnableOrders: ReturnableOrder[];
  /** Momento da leitura, base dos prazos ("7h restantes"). */
  now: number;
  /** Devolução com ação em andamento; "new" ao criar; null quando nenhuma. */
  pendingId: string | null;
  /** Abre a solicitação para o pedido; null se o pedido não aceita. */
  createReturn: (
    orderId: string,
    draft: ReturnRequestDraft,
  ) => Promise<ReturnRequest | null>;
  /** Leva a devolução contestada ou recusada à mediação da Neutra+. */
  requestMediation: (id: string) => Promise<boolean>;
}

export interface ReturnsProviderProps {
  children: ReactNode;
}
