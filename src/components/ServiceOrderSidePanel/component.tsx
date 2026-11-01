"use client";

import { Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeft,
  LuCalendar,
  LuCircleCheck,
  LuPlay,
  LuUserPlus,
} from "react-icons/lu";

import CoverageMap from "@/components/CoverageMap";
import { SERVICE_ORDER_ITEM_STYLES } from "@/data/serviceOrderStatus";
import {
  canCompleteServiceOrderItem,
  canStartServiceOrderItem,
  serviceOrderEvidenceProgress,
} from "@/functions/serviceOrders";

import { ServiceOrderSidePanelProps } from "./interface";

// Botões da coluna (Figma 2968-70483), da largura da coluna.
const ACTION = {
  w: "full",
  h: "41px",
  gap: "8px",
  rounded: "15px",
  fontSize: "13px",
  lineHeight: "19.5px",
} as const;

const SUCCESS = {
  ...ACTION,
  bg: "#10B981",
  color: "white",
  fontWeight: 700,
  _hover: { bg: "#0E9F6E" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
} as const;

/**
 * Coluna lateral do detalhe da OS (Figma 2968-70483; pendente: 2191-21596):
 * status atual, mapa do local, empresa/técnico/seller e as ações que o
 * status permite — iniciar, adicionar técnico, concluir e adiar.
 */
export function ServiceOrderSidePanel({
  item,
  order,
  backHref,
  isBusy,
  onStart,
  onAddTechnician,
  onPostpone,
  onComplete,
}: ServiceOrderSidePanelProps) {
  const { t } = useTranslation();
  const style = SERVICE_ORDER_ITEM_STYLES[item.status];
  const progress = serviceOrderEvidenceProgress(item);
  const isOpen = item.status !== "completed" && item.status !== "cancelled";

  const parties = [
    { key: "company", value: order.buyerName },
    { key: "technician", value: item.technician?.name ?? "—" },
  ];

  return (
    <Stack gap="16px">
      <Stack
        gap="8px"
        p="16px"
        bg={style.bg}
        borderWidth="1px"
        borderColor={style.border}
        rounded="12px"
      >
        <Text
          color="#5A6478"
          fontSize="11px"
          fontWeight={600}
          lineHeight="16.5px"
          letterSpacing="0.66px"
          textTransform="uppercase"
        >
          {t("ServiceOrders.detail.currentStatus")}
        </Text>
        <Flex align="center" gap="8px" color={style.color}>
          <Box boxSize="10px" rounded="full" bg={style.color} aria-hidden />
          <Text fontSize="15px" fontWeight={800} lineHeight="22.5px">
            {t(`ServiceOrders.item.status.${item.status}`)}
          </Text>
        </Flex>
      </Stack>

      <CoverageMap
        geometry={null}
        locations={
          item.location
            ? [{ ...item.location, label: item.address }]
            : undefined
        }
        height="240px"
        label={t("ServiceOrders.detail.map", { address: item.address })}
      />

      <Box
        as="dl"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="14px"
        overflow="hidden"
      >
        {parties.map((row) => (
          <Flex
            key={row.key}
            justify="space-between"
            gap="12px"
            px="16px"
            py="10px"
            borderBottomWidth="1px"
            borderColor="#F4F6F9"
          >
            <Text as="dt" color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
              {t(`ServiceOrders.detail.parties.${row.key}`)}
            </Text>
            <Text
              as="dd"
              color="#0F1729"
              fontSize="11px"
              fontWeight={600}
              lineHeight="16.5px"
              textAlign="end"
            >
              {row.value}
            </Text>
          </Flex>
        ))}
        <Flex justify="space-between" gap="12px" px="16px" py="12px">
          <Text
            as="dt"
            color="#0F1729"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {t("ServiceOrders.detail.parties.seller")}
          </Text>
          <Text
            as="dd"
            color="#0F1729"
            fontSize="11px"
            fontWeight={600}
            lineHeight="18px"
            textAlign="end"
          >
            {order.sellerName}
          </Text>
        </Flex>
      </Box>

      {item.status === "pending" && (
        <>
          <Button
            {...SUCCESS}
            disabled={!canStartServiceOrderItem(item) || isBusy}
            loading={isBusy}
            onClick={onStart}
          >
            <Icon as={LuPlay} boxSize="14px" />
            {t("ServiceOrders.detail.actions.start")}
          </Button>
          {!item.technician && (
            <Button
              {...ACTION}
              bg="#1F5AFF"
              color="white"
              fontWeight={700}
              _hover={{ bg: "#1646CC" }}
              disabled={isBusy}
              onClick={onAddTechnician}
            >
              <Icon as={LuUserPlus} boxSize="14px" />
              {t("ServiceOrders.detail.actions.addTechnician")}
            </Button>
          )}
        </>
      )}

      {item.status === "inProgress" && (
        <>
          <Button
            {...SUCCESS}
            disabled={!canCompleteServiceOrderItem(item) || isBusy}
            loading={isBusy}
            onClick={onComplete}
          >
            <Icon as={LuCircleCheck} boxSize="14px" />
            {t("ServiceOrders.detail.actions.complete")}
          </Button>
          {progress.done < progress.total && (
            <Text
              px="12px"
              py="10px"
              bg="#FFFBEB"
              borderWidth="1px"
              borderColor="#FDE68A"
              rounded="12px"
              color="#92400E"
              fontSize="12px"
              lineHeight="18px"
            >
              {t("ServiceOrders.detail.actions.completeBlocked", {
                done: progress.done,
                total: progress.total,
              })}
            </Text>
          )}
        </>
      )}

      {isOpen && (
        <Button
          {...ACTION}
          variant="plain"
          bg="#FFFBEB"
          borderWidth="1px"
          borderColor="#FDE68A"
          color="#D97706"
          fontWeight={600}
          _hover={{ bg: "#FEF3C7" }}
          disabled={isBusy}
          onClick={onPostpone}
        >
          <Icon as={LuCalendar} boxSize="14px" />
          {t("ServiceOrders.detail.actions.postpone")}
        </Button>
      )}

      <Button
        {...ACTION}
        variant="plain"
        borderWidth="1px"
        borderColor="#E5E8EE"
        color="#8A9AB5"
        fontWeight={400}
        _hover={{ bg: "#F4F6F9" }}
        asChild
      >
        <NextLink href={backHref}>
          <Icon as={LuArrowLeft} boxSize="13px" />
          {t("ServiceOrders.detail.actions.back")}
        </NextLink>
      </Button>
    </Stack>
  );
}
