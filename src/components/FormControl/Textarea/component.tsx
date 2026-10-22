"use client";

import { Field, Textarea as ChakraTextarea } from "@chakra-ui/react";
import { forwardRef } from "react";

import { TextareaProps } from "./interface";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, helperText, required, id, name, ...rest },
    ref,
  ) {
    const fieldId = id ?? name;

    return (
      <Field.Root invalid={!!error} required={required}>
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

        <ChakraTextarea
          minH="88px"
          px="14px"
          py="12px"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          rounded="14px"
          color="fg.default"
          fontSize="14px"
          resize="vertical"
          _placeholder={{ color: "fg.muted" }}
          _focus={{ borderColor: "primary.default" }}
          id={fieldId}
          name={name}
          ref={ref}
          {...rest}
        />

        {!!helperText && <Field.HelperText>{helperText}</Field.HelperText>}
        <Field.ErrorText>{error}</Field.ErrorText>
      </Field.Root>
    );
  },
);
