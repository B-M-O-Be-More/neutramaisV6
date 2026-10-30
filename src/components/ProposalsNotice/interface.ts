import type { ReactNode } from "react";

export type ProposalsNoticeTone = "info" | "warning" | "danger" | "success";

export interface ProposalsNoticeProps {
  tone: ProposalsNoticeTone;
  /** Título em negrito acima do texto (opcional). */
  title?: ReactNode;
  children: ReactNode;
  /**
   * `dialog`: avisos dentro dos modais (texto escuro).
   * `page`: faixa da página, com texto azul mais claro (Figma 2073-38612).
   */
  size?: "dialog" | "page";
}
