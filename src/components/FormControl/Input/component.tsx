"use client";

import {
  Field,
  Flex,
  Input as ChakraInput,
  InputGroup,
} from "@chakra-ui/react";
import { forwardRef, type Ref } from "react";
import { IMaskMixin } from "react-imask";

import { InputProps } from "./interface";

// Estilo base do campo — usa tokens semânticos do tema, acompanhando o
// modo claro/escuro (fundo da superfície, borda padrão, foco na cor primária).
const styleProps = {
  h: "47px",
  bg: "bg.surface",
  borderWidth: "1px",
  borderColor: "border.default",
  rounded: "14px",
  color: "fg.default",
  fontSize: "14px",
  _placeholder: { color: "fg.muted" },
  _focus: { borderColor: "primary.default" },
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
  {
    label,
    labelEnd,
    error,
    helperText,
    required,
    id,
    name,
    mask,
    onAccept,
    startElement,
    endElement,
    ...rest
  },
  ref,
) {
  const fieldId = id ?? name;

  const control = mask ? (
    <MaskedInput
      mask={mask}
      onAccept={onAccept}
      id={fieldId}
      name={name}
      {...rest}
    />
  ) : (
    <ChakraInput {...styleProps} id={fieldId} name={name} ref={ref} {...rest} />
  );

  return (
    <Field.Root invalid={!!error} required={required}>
      {(!!label || !!labelEnd) && (
        <Flex w="full" align="center" justify="space-between" gap={2}>
          {!!label && (
            <Field.Label
              fontSize="13px"
              fontWeight={600}
              color="fg.default"
              htmlFor={fieldId}
              mb={0}
            >
              {label}
              <Field.RequiredIndicator />
            </Field.Label>
          )}
          {labelEnd}
        </Flex>
      )}

      {startElement || endElement ? (
        <InputGroup
          startElement={startElement}
          endElement={endElement}
          endElementProps={endElement ? { pointerEvents: "auto" } : undefined}
        >
          {control}
        </InputGroup>
      ) : (
        control
      )}

      {!!helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      <Field.ErrorText>{error}</Field.ErrorText>
    </Field.Root>
  );
});
