import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export type ProposalsNoticeTone =
  | "info"
  | "warning"
  | "danger"
  | "success"
  | "seller";

export interface ProposalsNoticeProps {
  tone: ProposalsNoticeTone;
  /** Título em negrito acima do texto (opcional). */
  title?: ReactNode;
  children: ReactNode;
  /**
   * `dialog`: avisos dentro dos modais (texto escuro).
   * `page`: faixa da página (no tom `info`, texto azul mais claro — Figma
   * 2073-38612).
   */
  size?: "dialog" | "page";
  /** Troca o ícone padrão do tom (ex.: renovação nos contratos). */
  icon?: IconType;
  /** Botão à direita do texto (ex.: "Gerenciar"). */
  action?: ReactNode;
}
