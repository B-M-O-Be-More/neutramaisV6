import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface ProposalFormFieldProps {
  /** `id` do controle — liga o rótulo e as mensagens a ele. */
  id: string;
  label: string;
  required?: boolean;
  /** Ícone pequeno antes do rótulo (localização, orçamento, prazo). */
  icon?: IconType;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  /** Texto de ajuda abaixo do campo (ex.: "Moeda fixada em BRL"). */
  helper?: string;
  children: ReactNode;
}
