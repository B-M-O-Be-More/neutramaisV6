import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export type WalletHintTone = "blue" | "purple" | "amber" | "green";

export interface WalletHintProps {
  tone: WalletHintTone;
  /** Linha em destaque; sem ela, só a descrição na cor da faixa. */
  title?: string;
  description: ReactNode;
  /** Ícone à esquerda (ex.: o alerta do aviso de saque). */
  icon?: IconType;
  /** "notice": faixa da página, maior; "inline": dentro de um card. */
  size?: "notice" | "inline";
}
