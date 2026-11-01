import type { Ticket, TicketsSummary } from "@/types/tickets";

export interface UseTicketsReturn {
  tickets: Ticket[];
  summary: TicketsSummary;
  /** Momento da leitura, base do SLA ("SLA: 2h"). */
  now: number;
  /** Ticket com ação em andamento; null quando nenhum. */
  pendingId: string | null;
  /** Comenta no ticket em atendimento; false se já foi resolvido. */
  addComment: (id: string, comment: string) => Promise<boolean>;
}
