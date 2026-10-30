"use client";

import { Flex, Icon, Stack, Text } from "@chakra-ui/react";

import { ProposalFormFieldProps } from "./interface";

/**
 * Aparência dos campos dos modais de proposta e RFQ: fundo cinza, raio 14 e
 * texto 13px (Figma 2063-32240).
 */
export const PROPOSAL_INPUT_STYLES = {
  minH: "41.5px",
  px: "17px",
  bg: "#F8F9FB",
  borderWidth: "1px",
  borderColor: "#E5E8EE",
  rounded: "14px",
  color: "#0F1729",
  fontSize: "13px",
  lineHeight: "19.5px",
  focusRingColor: "#1F5AFF",
  _placeholder: { color: "rgba(15,23,41,0.5)" },
} as const;

/**
 * `aria-describedby` do controle: erro (quando houver) e ajuda. Use com o
 * mesmo `id` passado ao `ProposalFormField`.
 */
export function proposalFieldDescribedBy(
  id: string,
  { error, helper }: { error?: string; helper?: string },
): string | undefined {
  const ids = [error && `${id}-error`, helper && `${id}-helper`].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

/** Campo dos modais de proposta e RFQ: rótulo, controle, erro e ajuda. */
export function ProposalFormField({
  id,
  label,
  required = false,
  icon,
  error,
  helper,
  children,
}: ProposalFormFieldProps) {
  return (
    <Stack gap={0} minW={0}>
      <Flex align="center" gap="4px" pb="6px">
        {icon && <Icon as={icon} boxSize="11px" color="#5A6478" aria-hidden />}
        <Text
          asChild
          color="#5A6478"
          fontSize="12px"
          fontWeight={600}
          lineHeight="18px"
        >
          <label htmlFor={id}>
            {label}
            {required && " *"}
          </label>
        </Text>
      </Flex>

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

      {helper && (
        <Text
          id={`${id}-helper`}
          pt="4px"
          color="#A0ABB8"
          fontSize="10px"
          lineHeight="15px"
        >
          {helper}
        </Text>
      )}
    </Stack>
  );
}
