import type { ReactNode } from "react";

export interface OfferFormFieldProps {
  /** `id` do controle — liga o rótulo e as mensagens a ele. */
  id: string;
  label: string;
  required?: boolean;
  /** Complemento cinza ao lado do rótulo (ex.: "— público para buyers"). */
  labelHint?: string;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  /** Texto de ajuda abaixo do campo (ex.: "Entre 1h e 72h · padrão 48h"). */
  helper?: string;
  /** Contador alinhado à direita (ex.: "12/100"). */
  counter?: string;
  children: ReactNode;
}
