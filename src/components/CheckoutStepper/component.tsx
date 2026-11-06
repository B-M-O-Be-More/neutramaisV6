"use client";

import { Flex, Icon, Text, chakra } from "@chakra-ui/react";
import { LuCheck, LuChevronRight } from "react-icons/lu";

import { CheckoutStepperProps } from "./interface";

/**
 * Passos do checkout (Figma "Checkout e pagamento"): o atual em azul, os
 * feitos em verde com ✓ e os próximos em cinza.
 */
export function CheckoutStepper({
  current,
  labels,
  onSelect,
}: CheckoutStepperProps) {
  return (
    <Flex
      as="ol"
      align="center"
      gap="6px"
      wrap="wrap"
      pb="16px"
      borderBottomWidth="1px"
      borderColor="#EEF0F4"
    >
      {labels.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        const clickable = done && !!onSelect;
        return (
          <Flex as="li" key={label} align="center" gap="6px">
            <chakra.button
              type="button"
              display="flex"
              alignItems="center"
              gap="6px"
              px="12px"
              h="30px"
              rounded="8px"
              bg={active ? "#EEF3FF" : "transparent"}
              color={active ? "#1F5AFF" : done ? "#10B981" : "#8A9AB5"}
              fontSize="13px"
              fontWeight={active ? 700 : 500}
              cursor={clickable ? "pointer" : "default"}
              disabled={!clickable}
              aria-current={active ? "step" : undefined}
              onClick={() => clickable && onSelect?.(step)}
            >
              {done ? (
                <Icon as={LuCheck} boxSize="13px" />
              ) : (
                <Text as="span">{step}</Text>
              )}
              {label}
            </chakra.button>
            {step < labels.length && (
              <Icon as={LuChevronRight} boxSize="12px" color="#C3CBD9" />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
