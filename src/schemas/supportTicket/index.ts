import * as yup from "yup";

import {
  NEW_TICKET_CATEGORIES,
  NEW_TICKET_PRIORITIES,
  type NewTicketCategory,
  type NewTicketPriority,
} from "@/services/supportTickets.service";

/* ---------------------------------------------------------------------------
 * Abertura de ticket de suporte (Figma 3100-50362). As mensagens são CHAVES
 * de tradução (TicketNew.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

export const TICKET_TITLE_MAX = 120;
export const TICKET_DESCRIPTION_MIN = 20;
export const TICKET_DESCRIPTION_MAX = 2000;
export const TICKET_REFERENCE_MAX = 40;
export const TICKET_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const TICKET_ATTACHMENTS_MAX = 5;

export const supportTicketSchema = yup.object({
  category: yup
    .mixed<NewTicketCategory>()
    .oneOf([...NEW_TICKET_CATEGORIES], "TicketNew.errors.categoryRequired")
    .required("TicketNew.errors.categoryRequired"),
  priority: yup
    .mixed<NewTicketPriority>()
    .oneOf([...NEW_TICKET_PRIORITIES], "TicketNew.errors.priorityRequired")
    .required("TicketNew.errors.priorityRequired")
    .default("P3"),
  title: yup
    .string()
    .trim()
    .required("TicketNew.errors.titleRequired")
    .max(TICKET_TITLE_MAX, "TicketNew.errors.titleTooLong")
    .default(""),
  description: yup
    .string()
    .trim()
    .required("TicketNew.errors.descriptionRequired")
    .min(TICKET_DESCRIPTION_MIN, "TicketNew.errors.descriptionTooShort")
    .max(TICKET_DESCRIPTION_MAX, "TicketNew.errors.descriptionTooLong")
    .default(""),
  reference: yup
    .string()
    .trim()
    .max(TICKET_REFERENCE_MAX, "TicketNew.errors.referenceTooLong")
    .default(""),
  attachments: yup
    .array(yup.mixed<File>().required())
    .max(TICKET_ATTACHMENTS_MAX, "TicketNew.errors.tooManyFiles")
    .test(
      "file-size",
      "TicketNew.errors.fileTooLarge",
      (files) =>
        !files ||
        files.every((file) => file.size <= TICKET_ATTACHMENT_MAX_BYTES),
    )
    .default([]),
});

export type SupportTicketValues = yup.InferType<typeof supportTicketSchema>;
