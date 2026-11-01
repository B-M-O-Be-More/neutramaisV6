"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuWrench } from "react-icons/lu";

import { formatDateTime } from "@/functions/formatDateTime";
import { formatShortDate } from "@/functions/proposalFormat";

import { ServiceOrderInfoCardProps } from "./interface";

/**
 * "Informações da OS" (Figma 2968-70369): local, técnico responsável,
 * agendamento, SLA, última atualização, reagendamentos e observações.
 */
export function ServiceOrderInfoCard({
  item,
  locale,
}: ServiceOrderInfoCardProps) {
  const { t } = useTranslation();

  const rows = [
    { key: "address", value: item.address },
    {
      key: "technician",
      value:
        item.technician?.name ??
        (item.remote ? t("ServiceOrders.detail.info.remote") : "—"),
    },
    {
      key: "schedule",
      value: item.scheduledAt ? formatDateTime(item.scheduledAt, locale) : "—",
    },
    { key: "sla", value: formatShortDate(item.slaDeadline, locale) },
    { key: "updatedAt", value: formatDateTime(item.updatedAt, locale) },
    {
      key: "reschedules",
      value: t("ServiceOrders.detail.info.reschedulesValue", {
        used: item.reschedulesUsed,
        allowed: item.reschedulesAllowed,
      }),
    },
  ];

  return (
    <Stack
      as="section"
      aria-labelledby="service-order-info"
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="14px"
      overflow="hidden"
    >
      <Flex
        align="center"
        gap="8px"
        px="20px"
        py="16px"
        borderBottomWidth="1px"
        borderColor="#F4F6F9"
      >
        <Icon as={LuWrench} boxSize="14px" color="#D97706" aria-hidden />
        <Text
          id="service-order-info"
          as="h2"
          color="#0F1729"
          fontSize="13px"
          fontWeight={700}
          lineHeight="19.5px"
        >
          {t("ServiceOrders.detail.info.title")}
        </Text>
      </Flex>

      <Box as="dl">
        {rows.map((row) => (
          <Flex
            key={row.key}
            justify="space-between"
            align="flex-start"
            gap="16px"
            px="20px"
            py="12px"
            borderBottomWidth="1px"
            borderColor="#F4F6F9"
          >
            <Text
              as="dt"
              flexShrink={0}
              color="#8A9AB5"
              fontSize="12px"
              lineHeight="18px"
            >
              {t(`ServiceOrders.detail.info.${row.key}`)}
            </Text>
            <Text
              as="dd"
              minW={0}
              color="#0F1729"
              fontSize="12px"
              fontWeight={600}
              lineHeight="18px"
              textAlign="end"
              overflowWrap="anywhere"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
      </Box>

      {item.notes && (
        <Stack gap="2px" px="20px" py="16px" bg="#F8F9FB">
          <Text
            color="#A0ABB8"
            fontSize="9px"
            fontWeight={700}
            lineHeight="13.5px"
            letterSpacing="0.45px"
            textTransform="uppercase"
          >
            {t("ServiceOrders.detail.info.notes")}
          </Text>
          <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
            {item.notes}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
