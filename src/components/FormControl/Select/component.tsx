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
          <Field.Label fontWeight={500} color="#D1D5DC" htmlFor={fieldId}>
            {label}
            <Field.RequiredIndicator />
          </Field.Label>
        )}

        <NativeSelect.Root>
          <NativeSelect.Field
            border="1px solid #364153"
            bg={"#0A0E1A"}
            rounded={"8px"}
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
