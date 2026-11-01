"use client";

import { chakra, Flex, Text } from "@chakra-ui/react";

import { ProposalsStatusFilterProps } from "./interface";

/**
 * Abas de status com contador das listas de propostas e RFQs (Figma
 * 2073-38682). A aba ativa fica azul; o contador some quando é zero.
 */
export function ProposalsStatusFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  children,
}: ProposalsStatusFilterProps<T>) {
  return (
    <Flex align="center" gap="8px" wrap="wrap">
      <Flex role="tablist" aria-label={label} gap="8px" wrap="wrap">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <chakra.button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              display="flex"
              alignItems="center"
              gap="8px"
              px="17px"
              py="7px"
              rounded="10px"
              borderWidth="1px"
              borderColor={isActive ? "#1F5AFF" : "#E5E8EE"}
              bg={isActive ? "#1F5AFF" : "white"}
              color={isActive ? "white" : "#5A6478"}
              cursor="pointer"
              flexShrink={0}
              _hover={isActive ? undefined : { bg: "#F4F6F9" }}
              _focusVisible={{
                outline: "2px solid #1F5AFF",
                outlineOffset: "2px",
              }}
            >
              <Text
                fontSize="13px"
                fontWeight={isActive ? 700 : 400}
                lineHeight="19.5px"
                whiteSpace="nowrap"
              >
                {option.label}
              </Text>
              {option.count ? (
                <Text
                  as="span"
                  px="6px"
                  rounded="full"
                  bg={isActive ? "rgba(255,255,255,0.2)" : "#F4F6F9"}
                  color={isActive ? "white" : "#8A9AB5"}
                  fontSize="10px"
                  fontWeight={700}
                  lineHeight="16px"
                >
                  {option.count}
                </Text>
              ) : null}
            </chakra.button>
          );
        })}
      </Flex>
      {children}
    </Flex>
  );
}
