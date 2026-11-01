import type { ReactNode } from "react";

export interface OrderSideRow {
  key: string;
  label: string;
  value: ReactNode;
  /** Linha de total: fundo cinza e valor em destaque. */
  emphasis?: boolean;
}

export interface OrderSideCardProps {
  title: string;
  rows: OrderSideRow[];
}
