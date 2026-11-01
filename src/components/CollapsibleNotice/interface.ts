import type { ReactNode } from "react";
import type { IconType } from "react-icons";

/** `blue`: área do buyer (propostas). `purple`: suporte. */
export type CollapsibleNoticeTone = "blue" | "purple";

export interface CollapsibleNoticeProps {
  tone: CollapsibleNoticeTone;
  icon: IconType;
  title: ReactNode;
  description: ReactNode;
  /** Nomes acessíveis dos botões, já traduzidos. */
  labels: { collapse: string; expand: string; dismiss: string };
  /** Fecha a faixa. */
  onDismiss: () => void;
}
