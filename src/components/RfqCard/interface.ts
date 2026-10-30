import type { Rfq } from "@/types/proposals";

export type RfqCardAction =
  | "viewProposals"
  | "requestRevision"
  | "follow"
  | "cancel"
  | "viewOrder"
  | "newRfq";

export interface RfqCardProps {
  rfq: Rfq;
  /** Idioma para moeda e datas. */
  locale: string;
  /** Instante de referência das horas restantes (Date.now()). */
  now: number;
  /** Seleção em lote ligada: RFQs canceláveis ganham uma caixa de seleção. */
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onAction: (action: RfqCardAction) => void;
}
