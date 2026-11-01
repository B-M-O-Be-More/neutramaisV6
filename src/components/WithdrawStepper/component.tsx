"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";

import { WithdrawStepperProps } from "./interface";

const STEPS = ["amount", "destination", "review", "confirmation"] as const;

/** Etapas do saque (Figma 2215-23997): número, nome e o traço entre elas. */
export function WithdrawStepper({
  current,
  isComplete = false,
}: WithdrawStepperProps) {
  const { t } = useTranslation();

  return (
    <Flex
      as="ol"
      align="flex-start"
      gap="8px"
      w="full"
      maxW="512px"
      mx="auto"
      listStyleType="none"
    >
      {STEPS.map((step, index) => {
        const isDone = isComplete || index < current;
        const isActive = !isComplete && index === current;
        const label = t(`Wallet.withdraw.steps.${step}`);
        return (
          <React.Fragment key={step}>
            <Stack
              as="li"
              align="center"
              gap="4px"
              flex="1"
              minW={0}
              aria-current={isActive ? "step" : undefined}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="28px"
                bg={isDone ? "#1F5AFF" : "white"}
                borderWidth="2px"
                borderColor={isDone || isActive ? "#1F5AFF" : "#E5E8EE"}
                rounded="full"
                color={isActive ? "#1F5AFF" : "#A0ABB8"}
                fontSize="11px"
                fontWeight={700}
                lineHeight="16.5px"
              >
                {isDone ? (
                  <Icon as={LuCheck} boxSize="13px" color="white" />
                ) : (
                  index + 1
                )}
              </Flex>
              <Text
                color={isActive || isDone ? "#0F1729" : "#A0ABB8"}
                fontSize="10px"
                fontWeight={isActive ? 700 : 400}
                lineHeight="15px"
                textAlign="center"
                truncate
              >
                {label}
              </Text>
            </Stack>
            {index < STEPS.length - 1 && (
              <Box
                aria-hidden
                flex="1"
                h="2px"
                mt="13px"
                bg={isDone ? "#1F5AFF" : "#E5E8EE"}
                rounded="full"
              />
            )}
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
