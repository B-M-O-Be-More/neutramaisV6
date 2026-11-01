import type { ReactNode } from "react";
import type { IconType } from "react-icons";

import type { ServiceOrderSummaryStyle } from "@/data/serviceOrderStatus";

export interface ServiceOrderSummaryCardProps {
  title: string;
  /** "DataBridge Corp. · ORD-2026-001 · Criado em 02/07/2026". */
  meta: string;
  /** Linha em âmbar abaixo (prazo para responder, adiamento). */
  alert?: { icon: IconType; text: string; strong?: boolean };
  statusLabel: string;
  statusStyle: ServiceOrderSummaryStyle;
  /** Valor já formatado na moeda. */
  amount: string;
  /** Situação abaixo do valor ("Ordem de serviço criada"). */
  caption?: string;
  /** Situação no tom do status (recebido, adiado), menor. */
  captionAccent?: boolean;
  /** Destino de "Ver detalhes". */
  detailsHref: string;
  /** Botões à direita do pé do card. */
  actions?: ReactNode;
}
