import type { ReactNode } from "react";

export interface OrderShippingDialogProps {
  open: boolean;
  title: string;
  /** Linha abaixo do título com o pedido (ex.: "Pedido #E2B7D4A9"). */
  description: string;
  /** Enquanto envia, o modal não fecha. */
  isPending: boolean;
  /** Largura máxima: o formulário da NF é mais largo que o do rastreio. */
  maxW?: string;
  onClose: () => void;
  /** O formulário, com corpo e rodapé próprios. */
  children: ReactNode;
}
