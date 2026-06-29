import { NativeSelectFieldProps } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface SelectProps extends NativeSelectFieldProps {
  /** Texto exibido acima do campo. */
  label?: string;
  /** Mensagem de erro inline (geralmente errors.campo?.message do RHF). */
  error?: string;
  /** Texto auxiliar abaixo do campo. */
  helperText?: ReactNode;
  /** Marca o campo como obrigatório (exibe o indicador no label). */
  required?: boolean;
}
