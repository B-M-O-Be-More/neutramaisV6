"use client";

import { Input } from "@chakra-ui/react";
import type { FactoryOpts } from "imask";
import { forwardRef, type Ref } from "react";
import { IMaskMixin } from "react-imask";

import { OfferMaskedInputProps } from "./interface";

/** Só dígitos (velocidade, latência): letras e símbolos são ignorados. */
export const DIGITS_MASK: FactoryOpts = { mask: /^\d*$/ };

/** Percentual de 0 a 100 com até 2 casas e vírgula ("98,5"). */
export const PERCENT_MASK: FactoryOpts = {
  mask: Number,
  scale: 2,
  radix: ",",
  mapToRadix: ["."],
  min: 0,
  max: 100,
  normalizeZeros: true,
};

/** Raio em km com até 1 casa ("2,5"), de 0 a 500. */
export const RADIUS_KM_MASK: FactoryOpts = {
  mask: Number,
  scale: 1,
  radix: ",",
  mapToRadix: ["."],
  min: 0,
  max: 500,
  normalizeZeros: true,
};

/**
 * Valor monetário em formato brasileiro ("1.890,00"). O ponto é separador de
 * milhar: o IMask mapeia "." para a vírgula decimal por padrão, e colar
 * "1.890,00" viraria 1,89 — por isso `mapToRadix` só aceita a vírgula.
 */
export const MONEY_MASK: FactoryOpts = {
  mask: Number,
  scale: 2,
  thousandsSeparator: ".",
  radix: ",",
  mapToRadix: [","],
  padFractionalZeros: true,
  normalizeZeros: true,
  min: 0,
  max: 999_999_999.99,
};

// O IMask controla o <input> pelo inputRef; o valor mascarado volta pelo
// `onAccept` (use com Controller do RHF).
const MaskedChakraInput = IMaskMixin(
  ({
    inputRef,
    ...props
  }: {
    inputRef?: Ref<HTMLInputElement>;
    [key: string]: unknown;
  }) => <Input {...props} ref={inputRef} />,
);

/**
 * Input do assistente de oferta com máscara (react-imask): só dígitos,
 * percentual ou dinheiro. Visual vem das props do Chakra.
 */
export const OfferMaskedInput = forwardRef<
  HTMLInputElement,
  OfferMaskedInputProps
>(function OfferMaskedInput({ maskOptions, value, onAccept, ...rest }, ref) {
  return (
    <MaskedChakraInput
      {...maskOptions}
      {...rest}
      value={value}
      inputRef={ref}
      onAccept={(accepted: string) => onAccept(accepted)}
    />
  );
});
