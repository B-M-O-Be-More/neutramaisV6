import type { ReactNode } from "react";

export interface CartSellerGroupProps {
  /** Título do card (ex.: o seller do pedido). */
  title: string;
  /** Selo à direita (ex.: "Pedido 1"). */
  badge?: string;
  /** Linhas do pedido (`CartItemRow`). */
  children: ReactNode;
  /** Rodapé: "N itens neste pedido". */
  countLabel?: string;
  /** Rodapé: "Subtotal: R$ …". */
  subtotalLabel?: string;
}
