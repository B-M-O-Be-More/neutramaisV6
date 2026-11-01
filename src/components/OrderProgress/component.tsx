"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";

import { ORDER_PROGRESS_STEPS, orderProgress } from "@/functions/orderStage";

import { OrderProgressProps } from "./interface";

/**
 * "Progresso do pedido" (Figma 2191-17835): Criado → Pago · Em escrow →
 * Aceito → Em execução. Passos concluídos em verde com ✓; o atual com o
 * número; o trilho fica verde até o passo atual.
 */
export function OrderProgress({ stage }: OrderProgressProps) {
  const { t } = useTranslation();
  const { done, current } = orderProgress(stage);
  const greenUntil = current ?? done - 1;

  return (
    <Stack
      as="section"
      aria-label={t("OrderDetail.progress.title")}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
    >
      <Text color="#5A6478" fontSize="12px" fontWeight={600} lineHeight="18px">
        {t("OrderDetail.progress.title")}
      </Text>
      <Flex as="ol" align="flex-start" listStyleType="none" overflowX="auto">
        {ORDER_PROGRESS_STEPS.map((step, index) => {
          const isDone = index < done;
          const isCurrent = index === current;
          const label = t(`OrderDetail.progress.steps.${step}`);
          return (
            <React.Fragment key={step}>
              {index > 0 && (
                <Box
                  aria-hidden
                  flex="1"
                  minW="24px"
                  h="2px"
                  mt="15px"
                  mx="4px"
                  rounded="full"
                  bg={index <= greenUntil ? "#10B981" : "#E5E8EE"}
                />
              )}
              <Stack
                as="li"
                align="center"
                gap="6px"
                minW="80px"
                aria-current={isCurrent ? "step" : undefined}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="32px"
                  rounded="full"
                  borderWidth="2px"
                  borderColor={isDone || isCurrent ? "#10B981" : "#E5E8EE"}
                  bg={isCurrent ? "#EDFBF5" : isDone ? "#10B981" : "white"}
                >
                  {isDone && !isCurrent ? (
                    <Icon as={LuCheck} boxSize="14px" color="white" />
                  ) : (
                    <Text
                      color={isCurrent ? "#10B981" : "#A0ABB8"}
                      fontSize="11px"
                      fontWeight={700}
                      lineHeight="16.5px"
                    >
                      {index + 1}
                    </Text>
                  )}
                </Flex>
                <Text
                  color={isCurrent ? "#0F1729" : "#A0ABB8"}
                  fontSize="10px"
                  fontWeight={isCurrent ? 600 : 400}
                  lineHeight="12.5px"
                  textAlign="center"
                >
                  {label}
                </Text>
              </Stack>
            </React.Fragment>
          );
        })}
      </Flex>
    </Stack>
  );
}
