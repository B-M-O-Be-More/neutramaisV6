"use client";

import { Flex, Stack, Text } from "@chakra-ui/react";

import { OfferFormFieldProps } from "./interface";

/**
 * Aparência dos campos do assistente de oferta: fundo cinza, raio 14 e foco
 * na cor do seller (Figma 2073-48148).
 */
export const OFFER_INPUT_STYLES = {
  px: "17px",
  bg: "#F8F9FB",
  borderWidth: "1px",
  rounded: "14px",
  color: "#0F1729",
  focusRingColor: "#8B5CF6",
  _placeholder: { color: "rgba(15,23,41,0.5)" },
} as const;

/**
 * `aria-describedby` do controle: erro (quando houver) e ajuda/contador.
 * Use com o mesmo `id` passado ao `OfferFormField`.
 */
export function offerFieldDescribedBy(
  id: string,
  { error, helper }: { error?: string; helper?: string },
): string | undefined {
  const ids = [error && `${id}-error`, helper && `${id}-helper`].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

/**
 * Campo do assistente de oferta: rótulo (com asterisco e complemento),
 * controle, erro, ajuda e contador de caracteres.
 */
export function OfferFormField({
  id,
  label,
  required = false,
  labelHint,
  error,
  helper,
  counter,
  children,
}: OfferFormFieldProps) {
  return (
    <Stack gap={0} minW={0}>
      <Text
        asChild
        pb="6px"
        color="#0F1729"
        fontSize="14px"
        fontWeight={700}
        lineHeight="21px"
      >
        <label htmlFor={id}>
          {label}
          {required && (
            <Text as="span" color="#EF4444">
              {" *"}
            </Text>
          )}
          {labelHint && (
            <Text
              as="span"
              ms="6px"
              color="#A0ABB8"
              fontSize="12px"
              fontWeight={400}
            >
              {labelHint}
            </Text>
          )}
        </label>
      </Text>

      {children}

      {error && (
        <Text
          id={`${id}-error`}
          pt="4px"
          color="#EF4444"
          fontSize="12px"
          lineHeight="18px"
        >
          {error}
        </Text>
      )}

      {(helper || counter) && (
        <Flex justify="space-between" gap="12px" pt="4px">
          {helper && (
            <Text
              id={`${id}-helper`}
              color="#A0ABB8"
              fontSize="11px"
              lineHeight="16.5px"
              aria-live="polite"
            >
              {helper}
            </Text>
          )}
          {counter && (
            <Text
              ms="auto"
              color="#A0ABB8"
              fontSize="11px"
              lineHeight="16.5px"
              aria-live="polite"
            >
              {counter}
            </Text>
          )}
        </Flex>
      )}
    </Stack>
  );
}
