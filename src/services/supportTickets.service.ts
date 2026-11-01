// Abertura de ticket de suporte (Figma 3100-50362). A API de suporte ainda
// não existe (a lista de Tickets usa os dados do design): o formulário está
// pronto e chama `create`; até a rota existir, ela recusa com
// `SupportTicketsUnavailableError` — nenhum ticket é aberto.

/** Categorias do formulário: as da lista de Tickets mais "Outro". */
export const NEW_TICKET_CATEGORIES = [
  "provisioning",
  "slaQuality",
  "fiscal",
  "contracts",
  "generalQuestion",
  "other",
] as const;
export type NewTicketCategory = (typeof NEW_TICKET_CATEGORIES)[number];

/** P4 fica para as dúvidas de pré-venda, abertas pela oferta. */
export const NEW_TICKET_PRIORITIES = ["P1", "P2", "P3"] as const;
export type NewTicketPriority = (typeof NEW_TICKET_PRIORITIES)[number];

export interface NewTicketInput {
  category: NewTicketCategory;
  priority: NewTicketPriority;
  title: string;
  description: string;
  /** Pedido ou oferta relacionados (ex.: ORD-2026-001). */
  reference: string;
  attachments: File[];
}

/** O backend ainda não oferece a rota de tickets. */
export class SupportTicketsUnavailableError extends Error {
  constructor() {
    super("Support tickets endpoint not available");
    this.name = "SupportTicketsUnavailableError";
  }
}

export const supportTicketsService = {
  /** Abre o ticket. Hoje sempre recusa: não há rota no backend. */
  create: async (input: NewTicketInput): Promise<{ id: string }> => {
    void input;
    throw new SupportTicketsUnavailableError();
  },
};
