"use client";

import { Field, NativeSelect } from "@chakra-ui/react";
import { forwardRef } from "react";

import { SelectProps } from "./interface";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, helperText, required, id, name, children, ...rest },
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

        <NativeSelect.Root>
          <NativeSelect.Field
            h="47px"
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.default"
            rounded="14px"
            color="fg.default"
            fontSize="14px"
            _focus={{ borderColor: "primary.default" }}
            id={fieldId}
            name={name}
            ref={ref}
            {...rest}
          >
            {children}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        {!!helperText && <Field.HelperText>{helperText}</Field.HelperText>}
        <Field.ErrorText>{error}</Field.ErrorText>
      </Field.Root>
    );
  },
);
