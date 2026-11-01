import type { Ticket } from "@/types/tickets";

export interface TicketCardProps {
  ticket: Ticket;
  locale: string;
  /** Base do SLA ("SLA: 2h"). */
  now: number;
  /** Descrição, responsável e comentário visíveis abaixo do card. */
  expanded: boolean;
  /** Comentário sendo enviado. */
  isPending: boolean;
  onToggle: () => void;
  /** Envia o comentário; true limpa o campo. */
  onComment: (comment: string) => Promise<boolean>;
}
