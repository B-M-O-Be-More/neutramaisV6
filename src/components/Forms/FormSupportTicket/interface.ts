import type { NewTicketInput } from "@/services/supportTickets.service";

export interface FormSupportTicketProps {
  /** Idioma do tamanho dos anexos (ex.: "pt-BR"). */
  locale: string;
  /** Abre o ticket; devolve a chave de tradução do erro, ou null. */
  onSubmit: (input: NewTicketInput) => Promise<string | null>;
}
