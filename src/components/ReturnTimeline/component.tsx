"use client";

import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { RETURN_RETURNING_STATUSES } from "@/data/returnStatus";
import type { ReturnStatus } from "@/types/returns";

import { ReturnTimelineProps } from "./interface";

const STEPS = ["requested", "sellerReview", "shipping"] as const;

type StepState = "done" | "current" | "pending";

const DOT_COLORS: Record<StepState, string> = {
  done: "#10B981",
  current: "#1F5AFF",
  pending: "#C4CDD8",
};

/** Etapa em andamento: análise do seller até o aceite; depois, a postagem. */
function currentStep(status: ReturnStatus): number {
  return RETURN_RETURNING_STATUSES.includes(status) ? 2 : 1;
}

/** "Acompanhamento" da devolução (Figma 2943-31598). */
export function ReturnTimeline({ status }: ReturnTimelineProps) {
  const { t } = useTranslation();
  const current = currentStep(status);

  return (
    <Stack
      as="section"
      gap="12px"
      p="16px"
      bg="#EEF3FF"
      borderWidth="1px"
      borderColor="#C7D8FF"
      rounded="12px"
    >
      <Text
        as="h2"
        color="#1F5AFF"
        fontSize="11px"
        fontWeight={700}
        lineHeight="16.5px"
      >
        {t("Returns.detail.timeline")}
      </Text>
      <Stack as="ol" gap="12px" listStyleType="none">
        {STEPS.map((step, index) => {
          const state: StepState =
            index < current
              ? "done"
              : index === current
                ? "current"
                : "pending";
          return (
            <Flex
              as="li"
              key={step}
              gap="8px"
              align="flex-start"
              aria-current={state === "current" ? "step" : undefined}
            >
              <Box
                boxSize="12px"
                mt="2px"
                flexShrink={0}
                rounded="full"
                bg={DOT_COLORS[state]}
              />
              <Text color="#5A6478" fontSize="10px" lineHeight="15px">
                {t(`Returns.timeline.${step}`)}
              </Text>
            </Flex>
          );
        })}
      </Stack>
    </Stack>
  );
}
