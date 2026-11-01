import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * Tickets de suporte (Figma 3108-102318). As mensagens são CHAVES de tradução
 * (Tickets.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const LONG_MAX = 2000;

/** Comentário no andamento do ticket. */
export const ticketCommentSchema = yup.object({
  comment: yup
    .string()
    .trim()
    .required("Tickets.errors.commentRequired")
    .max(LONG_MAX, "Tickets.errors.tooLong")
    .default(""),
});

export type TicketCommentValues = yup.InferType<typeof ticketCommentSchema>;
