import type { ReactNode } from "react";

export interface ProposalsDialogFrameProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  /** Ação em andamento: bloqueia o fechamento. */
  isBusy?: boolean;
  /** Confirmação destrutiva: o leitor de tela anuncia como alerta. */
  role?: "dialog" | "alertdialog";
  /** `filled`: botão de fechar com fundo cinza (tela de sucesso). */
  closeTone?: "plain" | "filled";
  /** Largura máxima; o padrão é a dos modais do design (672px). */
  maxW?: string;
  /** Botões de ação, abaixo do conteúdo e separados por uma linha. */
  footer?: ReactNode;
  children: ReactNode;
}

export interface ProposalsDialogFooterProps {
  /** Espaço entre os botões (o design usa 20px; 12px e 25px em alguns). */
  gap?: string;
  children: ReactNode;
}
