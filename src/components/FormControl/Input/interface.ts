import { InputProps as ChakraInputProps } from "@chakra-ui/react";
import { ReactNode } from "react";

// Omitimos o `mask` do Chakra (prop de estilo/SVG) para usar o da máscara (react-imask).
export interface InputProps extends Omit<ChakraInputProps, "mask"> {
  /** Texto exibido acima do campo. */
  label?: string;
  /** Mensagem de erro inline (geralmente errors.campo?.message do RHF). */
  error?: string;
  /** Texto auxiliar abaixo do campo. */
  helperText?: ReactNode;
  /**
   * Máscara (react-imask). Quando informada, o input passa a usar IMaskInput.
   * Use com Controller do RHF + onAccept para popular o valor.
   */
  mask?: string | RegExp;
  /** Callback do react-imask com o valor a cada alteração aceita. */
  onAccept?: (value: string) => void;
  /**
   * Quando true, `value`/`onAccept` operam com o valor SEM máscara (só os dados),
   * enquanto a exibição permanece formatada. Útil para enviar o payload limpo.
   */
  unmask?: boolean | "typed";
}
