"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuCircleCheck, LuCircleX, LuClock } from "react-icons/lu";

import { formatShortDate, hoursUntil } from "@/functions/proposalFormat";
import {
  SERVICE_ORDER_PROGRESS_STEPS,
  serviceOrderProgressIndex,
} from "@/functions/serviceOrders";

import { ServiceOrderProgressProps } from "./interface";

/**
 * "Progresso TMF641" da OS (Figma 2968-72795): Reconhecida → Pendente → Em
 * execução → Concluída. Etapas vencidas em verde com ✓, a atual em azul com o
 * número; abaixo, o prazo de SLA.
 */
export function ServiceOrderProgress({
  item,
  locale,
  now,
}: ServiceOrderProgressProps) {
  const { t } = useTranslation();
  const current = serviceOrderProgressIndex(item);
  const slaHours = hoursUntil(item.slaDeadline, now);

  let banner: {
    icon: typeof LuClock;
    text: string;
    color: string;
    bg: string;
    border: string;
  };
  if (item.status === "completed") {
    banner = {
      icon: LuCircleCheck,
      text: t("ServiceOrders.detail.completedOn", {
        date: formatShortDate(item.completedAt ?? item.updatedAt, locale),
      }),
      color: "#10B981",
      bg: "#EDFBF5",
      border: "#AAECD5",
    };
  } else if (item.status === "cancelled") {
    banner = {
      icon: LuCircleX,
      text: t("ServiceOrders.detail.cancelled"),
      color: "#8A9AB5",
      bg: "#F4F6F9",
      border: "#E5E8EE",
    };
  } else {
    banner = {
      icon: LuClock,
      text: t("ServiceOrders.detail.slaDeadline", {
        date: formatShortDate(item.slaDeadline, locale),
        count: slaHours,
      }),
      color: slaHours > 0 ? "#D97706" : "#EF4444",
      bg: slaHours > 0 ? "#FFFBEB" : "#FEF2F2",
      border: slaHours > 0 ? "#FDE68A" : "#FECACA",
    };
  }

  return (
    <Stack
      as="section"
      aria-label={t("ServiceOrders.detail.progress")}
      gap="16px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Text color="#5A6478" fontSize="12px" fontWeight={600} lineHeight="18px">
        {t("ServiceOrders.detail.progress")}
      </Text>

      <Flex as="ol" align="flex-start" listStyleType="none" overflowX="auto">
        {SERVICE_ORDER_PROGRESS_STEPS.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
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
                  bg={index <= current ? "#10B981" : "#E5E8EE"}
                />
              )}
              <Stack
                as="li"
                align="center"
                gap="6px"
                minW="88px"
                aria-current={isCurrent ? "step" : undefined}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="32px"
                  rounded="full"
                  borderWidth="2px"
                  borderColor={
                    isDone ? "#10B981" : isCurrent ? "#1F5AFF" : "#E5E8EE"
                  }
                  bg={isDone ? "#10B981" : isCurrent ? "#EEF3FF" : "#F4F6F9"}
                >
                  {isDone ? (
                    <Icon as={LuCheck} boxSize="14px" color="white" />
                  ) : (
                    <Text
                      color={isCurrent ? "#1F5AFF" : "#A0ABB8"}
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
                  fontWeight={isCurrent ? 700 : 400}
                  lineHeight="15px"
                  textAlign="center"
                >
                  {t(`ServiceOrders.detail.steps.${step}`)}
                </Text>
              </Stack>
            </React.Fragment>
          );
        })}
      </Flex>

      <Flex
        align="center"
        gap="8px"
        px="16px"
        py="10px"
        bg={banner.bg}
        borderWidth="1px"
        borderColor={banner.border}
        rounded="8px"
        color={banner.color}
      >
        <Icon as={banner.icon} boxSize="13px" aria-hidden />
        <Text fontSize="12px" fontWeight={600} lineHeight="18px">
          {banner.text}
        </Text>
      </Flex>
    </Stack>
  );
}
