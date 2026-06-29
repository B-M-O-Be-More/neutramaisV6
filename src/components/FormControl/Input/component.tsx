"use client";

import { Field, Input as ChakraInput } from "@chakra-ui/react";
import { forwardRef, type Ref } from "react";
import { IMaskMixin } from "react-imask";

import { InputProps } from "./interface";

const styleProps = {
  border: "1px solid #364153",
  bg: "#0A0E1A",
  rounded: "8px",
} as const;

// Chakra Input com máscara (react-imask). O IMask gerencia o <input> via inputRef,
// por isso a digitação funciona normalmente (input não-controlado pelo React).
const MaskedInput = IMaskMixin(
  ({
    inputRef,
    ...props
  }: {
    inputRef?: Ref<HTMLInputElement>;
    [key: string]: unknown;
  }) => <ChakraInput {...styleProps} {...props} ref={inputRef} />,
);

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, required, id, name, mask, onAccept, ...rest },
  ref,
) {
  const fieldId = id ?? name;

  return (
    <Field.Root invalid={!!error} required={required}>
      {!!label && (
        <Field.Label fontWeight={500} color="#D1D5DC" htmlFor={fieldId}>
          {label}
          <Field.RequiredIndicator />
        </Field.Label>
      )}

      {mask ? (
        <MaskedInput
          mask={mask}
          onAccept={onAccept}
          id={fieldId}
          name={name}
          {...rest}
        />
      ) : (
        <ChakraInput
          {...styleProps}
          id={fieldId}
          name={name}
          ref={ref}
          {...rest}
        />
      )}

      {!!helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
});
