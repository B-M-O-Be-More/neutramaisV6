import type { IconType } from "react-icons";

export interface ProfileFieldProps {
  id: string;
  label: string;
  icon: IconType;
  value: string;
  /** Sem `onChange`, o campo é só leitura (fundo cinza). */
  onChange?: (value: string) => void;
  type?: "text" | "email" | "tel";
  maxLength?: number;
  /** Erro já traduzido. */
  error?: string;
}
