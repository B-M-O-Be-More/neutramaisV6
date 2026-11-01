"use client";

import { Box, Icon, Input, Stack, Text } from "@chakra-ui/react";

import { ProfileFieldProps } from "./interface";

/**
 * Campo do Meu Perfil com ícone à esquerda (Figma 2205-18445): só leitura,
 * em cinza, ou editável no modo de edição (Figma 2943-27630).
 */
export function ProfileField({
  id,
  label,
  icon,
  value,
  onChange,
  type = "text",
  maxLength,
  error,
}: ProfileFieldProps) {
  const isEditable = !!onChange;

  return (
    <Stack gap="6px">
      <Text
        asChild
        color="#5A6478"
        fontSize="12px"
        fontWeight={600}
        lineHeight="18px"
      >
        <label htmlFor={id}>{label}</label>
      </Text>
      <Box position="relative">
        <Icon
          as={icon}
          position="absolute"
          left="12px"
          top="50%"
          transform="translateY(-50%)"
          boxSize="14px"
          color="#8A9AB5"
          zIndex={1}
          pointerEvents="none"
        />
        <Input
          id={id}
          type={type}
          value={value}
          readOnly={!isEditable}
          maxLength={maxLength}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          h="42px"
          ps="36px"
          pe="16px"
          bg={isEditable ? "white" : "#F8F9FB"}
          borderWidth="1px"
          borderColor={error ? "#FECACA" : "#E5E8EE"}
          rounded="10px"
          color="#0F1729"
          fontSize="13px"
          _focusVisible={
            isEditable
              ? { borderColor: "#1F5AFF", outline: "none" }
              : { outline: "none" }
          }
        />
      </Box>
      {error && (
        <Text
          id={`${id}-error`}
          color="#EF4444"
          fontSize="11px"
          lineHeight="16.5px"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
}
