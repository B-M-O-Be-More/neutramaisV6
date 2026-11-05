import type { TicketCommentValues } from "@/schemas/tickets";

export type { TicketCommentValues };

export interface FormTicketCommentProps {
  /** Prefixo do id do campo (único na página). */
  id: string;
  isSubmitting: boolean;
  /** Envia o comentário; true limpa o campo. */
  onSubmit: (comment: string) => Promise<boolean>;
}
