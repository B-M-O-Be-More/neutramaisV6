"use client";

import { Input } from "@chakra-ui/react";
import type { FactoryOpts } from "imask";
import React, { forwardRef, type Ref } from "react";
import { IMaskMixin } from "react-imask";

import { parseDecimal } from "@/functions/parseDecimal";

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

/**
 * Raio em km com até 1 casa ("2,5"), até 80. O mínimo de 1 km é conferido no
 * schema — aqui o 0 fica livre para digitar "0," no caminho.
 */
export const RADIUS_KM_MASK: FactoryOpts = {
  mask: Number,
  scale: 1,
  radix: ",",
  mapToRadix: ["."],
  min: 0,
  max: 80,
  normalizeZeros: true,
};

/** Peso do pacote em kg com até 3 casas ("1,250"), até 1000. */
export const WEIGHT_KG_MASK: FactoryOpts = {
  mask: Number,
  scale: 3,
  radix: ",",
  mapToRadix: ["."],
  min: 0,
  max: 1000,
  normalizeZeros: true,
};

/** Lado do pacote em cm com até 2 casas ("30,5"), até 400. */
export const SIDE_CM_MASK: FactoryOpts = {
  mask: Number,
  scale: 2,
  radix: ",",
  mapToRadix: ["."],
  min: 0,
  max: 400,
  normalizeZeros: true,
};

/** CEP ("01310-100"). */
export const POSTAL_CODE_MASK: FactoryOpts = { mask: "00000-000" };

/**
 * Valor monetário em formato brasileiro ("1.890,00"), digitado como em caixa
 * de banco: começa em "0,00" e cada dígito entra pela direita (5 → "0,05",
 * 50 → "0,50", 500 → "5,00"). Não passa pelo IMask — o `OfferMaskedInput`
 * reconhece esta referência e usa o `MoneyInput`.
 */
export const MONEY_MASK: FactoryOpts = { mask: Number, scale: 2 };

/** 999.999.999,99 — 11 dígitos contando os centavos. */
const MONEY_MAX_DIGITS = 11;

/** "1.890,00" → "189000"; vazio ou zero → "". */
function moneyDigits(value: string | null | undefined): string {
  const amount = parseDecimal(value);
  if (amount === null || amount <= 0) return "";
  return Math.round(amount * 100).toString();
}

/** "189000" → "1.890,00"; "" → "0,00". Montado no texto, sem ponto flutuante. */
function formatMoneyDigits(digits: string): string {
  const padded = digits.replace(/^0+/, "").padStart(3, "0");
  const integer = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${integer},${padded.slice(-2)}`;
}

/**
 * Input de dinheiro em centavos: o cursor fica sempre no fim, digitar empurra
 * os dígitos para a esquerda e apagar tira o último. Zerado, devolve "" no
 * `onAccept` (o campo continua mostrando "0,00") para o "obrigatório" do
 * schema e os campos opcionais seguirem funcionando.
 */
const MoneyInput = forwardRef<
  HTMLInputElement,
  Omit<OfferMaskedInputProps, "maskOptions">
>(function MoneyInput({ value, onAccept, onSelect, ...rest }, ref) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const current = moneyDigits(value);
  const display = formatMoneyDigits(current);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const moveCaretToEnd = () => {
    const input = inputRef.current;
    if (!input || document.activeElement !== input) return;
    if (input.selectionStart !== input.selectionEnd) return;
    const end = input.value.length;
    if (input.selectionStart !== end) input.setSelectionRange(end, end);
  };

  React.useLayoutEffect(moveCaretToEnd, [display]);

  return (
    <Input
      {...rest}
      ref={setRefs}
      value={display}
      inputMode="numeric"
      onSelect={(event) => {
        moveCaretToEnd();
        onSelect?.(event);
      }}
      onChange={(event) => {
        const typed = event.target.value;
        let digits = typed.replace(/\D/g, "").replace(/^0+/, "");
        // Apagou só a vírgula ou o ponto: tira o último dígito.
        if (typed.length < display.length && digits === current) {
          digits = current.slice(0, -1);
        }
        if (digits.length > MONEY_MAX_DIGITS) return;
        onAccept(digits ? formatMoneyDigits(digits) : "");
      }}
    />
  );
});

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
  if (maskOptions === MONEY_MASK) {
    return <MoneyInput {...rest} value={value} onAccept={onAccept} ref={ref} />;
  }

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
