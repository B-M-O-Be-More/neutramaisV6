"use client";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import {
  SellerOrderTimelineProps,
  SellerOrderTimelineState,
} from "./interface";

// Concluído em verde, atual em azul, por vir em cinza (Figma 2948-51293).
const STATE_COLORS: Record<SellerOrderTimelineState, string> = {
  done: "#10B981",
  current: "#1F5AFF",
  pending: "#A0ABB8",
};

/**
 * "Linha do tempo" do pedido no card expandido: um ponto por etapa, ligados
 * por uma linha com a cor da etapa seguinte.
 */
export function SellerOrderTimeline({
  title,
  steps,
}: SellerOrderTimelineProps) {
  return (
    <Stack gap="12px" p="16px" bg="white" rounded="8px">
      <Text
        color="#0F1729"
        fontSize="11px"
        fontWeight={700}
        lineHeight="16.5px"
      >
        {title}
      </Text>
      <Flex as="ol" listStyleType="none" m={0} p={0}>
        {steps.map((step, index) => {
          const next = steps[index + 1];
          return (
            <Stack
              as="li"
              key={step.key}
              position="relative"
              flex="1"
              minW={0}
              align="center"
              gap="4px"
              pt="2px"
              aria-current={step.state === "current" ? "step" : undefined}
            >
              {next && (
                <Box
                  position="absolute"
                  top="7px"
                  left="calc(50% + 10px)"
                  right="calc(-50% + 10px)"
                  h="2px"
                  rounded="full"
                  bg={
                    next.state === "pending"
                      ? "#E5E8EE"
                      : STATE_COLORS[next.state]
                  }
                  aria-hidden
                />
              )}
              <Box
                boxSize="12px"
                rounded="full"
                bg={STATE_COLORS[step.state]}
                boxShadow={
                  step.state === "current"
                    ? "0 0 0 3px rgba(31,90,255,0.15)"
                    : undefined
                }
                aria-hidden
              />
              <Text
                color="#5A6478"
                fontSize="9px"
                lineHeight="13.5px"
                textAlign="center"
              >
                {step.label}
              </Text>
            </Stack>
          );
        })}
      </Flex>
    </Stack>
  );
}
