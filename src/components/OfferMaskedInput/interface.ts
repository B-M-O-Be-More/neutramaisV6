import type { InputProps } from "@chakra-ui/react";
import type { FactoryOpts } from "imask";

export interface OfferMaskedInputProps extends Omit<
  InputProps,
  "mask" | "value" | "onChange" | "defaultValue"
> {
  /** Opções do IMask (ex.: `{ mask: Number, scale: 2, radix: "," }`). */
  maskOptions: FactoryOpts;
  /** Valor exibido (já mascarado). */
  value: string;
  /** Recebe o valor mascarado a cada alteração aceita pela máscara. */
  onAccept: (value: string) => void;
}
