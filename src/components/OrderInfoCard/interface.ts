import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface OrderInfoRow {
  key: string;
  label: string;
  value: ReactNode;
  /** Mostra o botão de copiar com este texto. */
  copyValue?: string;
}

export interface OrderInfoCardProps {
  icon: IconType;
  iconColor: string;
  title: string;
  /** Linhas "rótulo · valor". */
  rows?: OrderInfoRow[];
  /** Conteúdo livre entre as linhas e o rodapé. */
  children?: ReactNode;
  /** Ações no rodapé cinza. */
  actions?: ReactNode;
  /** Observação no rodapé cinza, com ícone de informação. */
  note?: ReactNode;
}
