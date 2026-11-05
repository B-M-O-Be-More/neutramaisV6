import type { ServiceOrderMessage } from "@/types/serviceOrders";

export interface ServiceOrderChatProps {
  messages: ServiceOrderMessage[];
  /** Idioma para data e hora das mensagens. */
  locale: string;
  /** OS encerrada: só leitura. */
  disabled?: boolean;
  /** Envia a mensagem; `true` limpa o campo. */
  onSend: (text: string) => Promise<boolean>;
}
