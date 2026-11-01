"use client";

import { Stack, Text } from "@chakra-ui/react";

import {
  OfferCategoryPanelProps,
  OfferCategoryPanelTone,
  OfferPanelFieldProps,
} from "./interface";

/**
 * Visual dos controles dentro do painel: fundo branco, borda e foco na cor
 * da categoria (Figma 2074-56987 e 2074-59682).
 */
export function offerPanelControlStyles(
  tone: OfferCategoryPanelTone,
  error?: string,
) {
  return {
    h: "41.5px",
    px: "13px",
    bg: "white",
    borderWidth: "1px",
    borderColor: error ? "#EF4444" : tone.border,
    rounded: "10px",
    fontSize: "13px",
    color: "#0F1729",
    focusRingColor: tone.fg,
    _placeholder: { color: "rgba(15,23,41,0.5)" },
  } as const;
}

/** `aria-describedby` do controle quando há erro. */
export function offerPanelDescribedBy(
  id: string,
  error?: string,
): string | undefined {
  return error ? `${id}-error` : undefined;
}

/** Campo do painel: rótulo cinza em 12px, controle e erro. */
export function OfferPanelField({
  id,
  label,
  required = false,
  error,
  children,
}: OfferPanelFieldProps) {
  return (
    <Stack gap={0} minW={0}>
      <Text
        asChild
        pb="4px"
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
    </Stack>
  );
}

/**
 * Painel de campos específicos de uma categoria nas especificações técnicas
 * (ex.: Hardware / CPE, Recursos Numéricos), nas cores da categoria.
 */
export function OfferCategoryPanel({
  id,
  title,
  tone,
  children,
}: OfferCategoryPanelProps) {
  return (
    <Stack
      role="group"
      aria-labelledby={id}
      gap="16px"
      p="21px"
      bg={tone.bg}
      borderWidth="1px"
      borderColor={tone.border}
      rounded="14px"
    >
      <Text
        id={id}
        color={tone.fg}
        fontSize="14px"
        fontWeight={700}
        lineHeight="21px"
      >
        {title}
      </Text>
      {children}
    </Stack>
  );
}
