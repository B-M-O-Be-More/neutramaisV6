"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuCalendar,
  LuCamera,
  LuChevronUp,
  LuCircleCheck,
  LuClock,
  LuMapPin,
  LuTriangleAlert,
  LuUser,
  LuWrench,
} from "react-icons/lu";

import { SERVICE_ORDER_ITEM_STYLES } from "@/data/serviceOrderStatus";
import { formatDateTime } from "@/functions/formatDateTime";
import { formatShortDate, hoursUntil } from "@/functions/proposalFormat";
import {
  remainingReschedules,
  serviceOrderEvidenceProgress,
} from "@/functions/serviceOrders";

import { ServiceOrderItemCardProps } from "./interface";

/** Até 24h para o fim do SLA, o prazo fica vermelho. */
const URGENT_HOURS = 24;

/**
 * Demanda aberta ("Ver OS" — Figma 2191-27226, 2191-27992, 2191-28795 e
 * 2191-29511): status, SLA e evidências no topo; pedido, agenda, prazo,
 * observações e as evidências obrigatórias no corpo; e a ação do status.
 */
export function ServiceOrderItemCard({
  item,
  order,
  locale,
  now,
  detailsHref,
  onCollapse,
  onReschedule,
  onOpenDispute,
}: ServiceOrderItemCardProps) {
  const { t } = useTranslation();
  const style = SERVICE_ORDER_ITEM_STYLES[item.status];
  const progress = serviceOrderEvidenceProgress(item);
  const isOpen = item.status !== "completed" && item.status !== "cancelled";
  const slaHours = hoursUntil(item.slaDeadline, now);
  const isHeld = item.status === "held";

  const tiles = [
    { key: "orderId", value: order.orderId },
    {
      key: "schedule",
      value: item.scheduledAt
        ? formatDateTime(item.scheduledAt, locale)
        : item.remote
          ? t("ServiceOrders.item.remoteSchedule")
          : "—",
    },
    { key: "sla", value: formatShortDate(item.slaDeadline, locale) },
    { key: "updatedAt", value: formatDateTime(item.updatedAt, locale) },
  ];

  return (
    <Stack
      as="article"
      aria-label={`${item.productName} · ${item.id}`}
      gap={0}
      bg="white"
      borderWidth="1px"
      borderColor={isHeld ? "#FECACA" : "#E5E8EE"}
      rounded="14px"
      boxShadow={
        isHeld
          ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          : undefined
      }
    >
      <Flex
        gap="16px"
        p="20px"
        direction={{ base: "column", md: "row" }}
        justify="space-between"
      >
        <Flex gap="16px" align="flex-start" flex="1" minW={0}>
          <Flex
            align="center"
            justify="center"
            boxSize="40px"
            flexShrink={0}
            bg={style.bg}
            rounded="14px"
            aria-hidden
          >
            <Icon as={LuWrench} boxSize="16px" color={style.color} />
          </Flex>
          <Stack gap={0} flex="1" minW={0}>
            <Flex align="center" justify="space-between" gap="8px">
              <Text
                as="h3"
                color="#0F1729"
                fontSize="14px"
                fontWeight={700}
                lineHeight="21px"
              >
                {item.productName}
              </Text>
              {item.jeopardy && isOpen && (
                <Flex
                  align="center"
                  gap="4px"
                  px="8px"
                  py="2px"
                  bg="#FEF2F2"
                  borderWidth="1px"
                  borderColor="#FECACA"
                  rounded="8px"
                  color="#EF4444"
                  flexShrink={0}
                >
                  <Icon as={LuTriangleAlert} boxSize="9px" aria-hidden />
                  <Text fontSize="10px" fontWeight={700} lineHeight="15px">
                    {t("ServiceOrders.item.jeopardy")}
                  </Text>
                </Flex>
              )}
            </Flex>
            <Text pt="2px" color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("ServiceOrders.item.meta", {
                id: item.id,
                seller: order.sellerName,
                buyer: order.buyerName,
              })}
            </Text>
            <Flex
              pt="8px"
              gap="4px 16px"
              wrap="wrap"
              color="#5A6478"
              fontSize="11px"
              lineHeight="16.5px"
            >
              <Flex align="center" gap="4px">
                <Icon as={LuMapPin} boxSize="11px" aria-hidden />
                <Text>{item.address}</Text>
              </Flex>
              {item.technician && (
                <Flex align="center" gap="4px">
                  <Icon as={LuUser} boxSize="11px" aria-hidden />
                  <Text>{item.technician.name}</Text>
                </Flex>
              )}
            </Flex>
          </Stack>
        </Flex>

        <Stack
          gap="8px"
          align={{ base: "flex-start", md: "flex-end" }}
          flexShrink={0}
        >
          <Flex
            align="center"
            gap="6px"
            px="12px"
            py="4px"
            bg={style.bg}
            rounded="10px"
            color={style.color}
          >
            <Icon as={style.icon} boxSize="11px" aria-hidden />
            <Text fontSize="12px" fontWeight={600} lineHeight="18px">
              {t(`ServiceOrders.item.status.${item.status}`)}
            </Text>
          </Flex>
          {isOpen && (
            <Flex
              align="center"
              gap="4px"
              color={slaHours <= URGENT_HOURS ? "#EF4444" : "#D97706"}
            >
              <Icon as={LuClock} boxSize="10px" aria-hidden />
              <Text fontSize="11px" fontWeight={600} lineHeight="16.5px">
                {t("ServiceOrders.item.slaLeft", { count: slaHours })}
              </Text>
            </Flex>
          )}
          <Flex align="center" gap="6px">
            <Box
              w="96px"
              h="6px"
              bg="#F4F6F9"
              rounded="full"
              overflow="hidden"
              aria-hidden
            >
              <Box
                h="full"
                w={`${progress.percent}%`}
                bg={style.bar}
                rounded="full"
              />
            </Box>
            <Text color="#8A9AB5" fontSize="10px" lineHeight="15px">
              {t("ServiceOrders.item.evidenceCount", {
                done: progress.done,
                total: progress.total,
              })}
            </Text>
          </Flex>
          <IconButton
            aria-label={t("ServiceOrders.item.collapse")}
            aria-expanded
            variant="plain"
            size="2xs"
            minW="20px"
            h="20px"
            color="#A0ABB8"
            _hover={{ color: "#5A6478" }}
            onClick={onCollapse}
          >
            <Icon as={LuChevronUp} boxSize="14px" />
          </IconButton>
        </Stack>
      </Flex>

      <Stack gap="20px" p="20px" borderTopWidth="1px" borderColor="#F4F6F9">
        {!!item.noShows && (
          <Flex
            gap="12px"
            p="16px"
            bg="#FFFBEB"
            borderWidth="1px"
            borderColor="#FDE68A"
            rounded="10px"
          >
            <Icon
              as={LuTriangleAlert}
              boxSize="15px"
              mt="2px"
              flexShrink={0}
              color="#D97706"
              aria-hidden
            />
            <Stack gap="2px">
              <Text
                color="#D97706"
                fontSize="13px"
                fontWeight={700}
                lineHeight="19.5px"
              >
                {t("ServiceOrders.item.noShowTitle", { count: item.noShows })}
              </Text>
              <Text color="#92400E" fontSize="12px" lineHeight="18px">
                {t("ServiceOrders.item.noShowText", {
                  used: item.reschedulesUsed,
                  allowed: item.reschedulesAllowed,
                })}
              </Text>
            </Stack>
          </Flex>
        )}

        <Grid
          as="dl"
          templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
          gap="16px"
        >
          {tiles.map((tile) => (
            <Stack
              key={tile.key}
              gap="4px"
              p="12px"
              bg="#F8F9FB"
              rounded="10px"
            >
              <Text
                as="dt"
                color="#A0ABB8"
                fontSize="9px"
                fontWeight={700}
                lineHeight="13.5px"
                letterSpacing="0.45px"
                textTransform="uppercase"
              >
                {t(`ServiceOrders.item.tiles.${tile.key}`)}
              </Text>
              <Text
                as="dd"
                color="#0F1729"
                fontSize="13px"
                fontWeight={600}
                lineHeight="19.5px"
              >
                {tile.value}
              </Text>
            </Stack>
          ))}
        </Grid>

        {item.notes && (
          <Stack
            gap="4px"
            p="16px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="10px"
          >
            <Text
              color="#8A9AB5"
              fontSize="11px"
              fontWeight={700}
              lineHeight="16.5px"
              textTransform="uppercase"
            >
              {t("ServiceOrders.item.notes")}
            </Text>
            <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
              {item.notes}
            </Text>
          </Stack>
        )}

        <Stack gap="12px">
          <Text
            color="#0F1729"
            fontSize="13px"
            fontWeight={700}
            lineHeight="19.5px"
          >
            {t("ServiceOrders.item.evidences", {
              done: progress.done,
              total: progress.total,
            })}
          </Text>
          <Grid
            templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
            gap="12px"
          >
            {item.evidences.map((evidence, index) => {
              const isRegistered = !!evidence.fileName;
              return (
                <Stack
                  key={index}
                  align="center"
                  justify="center"
                  gap="8px"
                  minH="82px"
                  p="16px"
                  bg={isRegistered ? "#EDFBF5" : "#F8F9FB"}
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={isRegistered ? "#10B981" : "#C4CDD8"}
                  rounded="14px"
                >
                  <Icon
                    as={isRegistered ? LuCircleCheck : LuCamera}
                    boxSize="20px"
                    color={isRegistered ? "#10B981" : "#A0ABB8"}
                    aria-hidden
                  />
                  <Text
                    color={isRegistered ? "#10B981" : "#A0ABB8"}
                    fontSize="12px"
                    fontWeight={isRegistered ? 600 : 400}
                    lineHeight="18px"
                    textAlign="center"
                  >
                    {t(
                      isRegistered
                        ? "ServiceOrders.item.evidenceRegistered"
                        : "ServiceOrders.item.evidencePending",
                      { index: index + 1 },
                    )}
                  </Text>
                </Stack>
              );
            })}
          </Grid>
        </Stack>

        <Flex
          align="center"
          justify="space-between"
          gap="8px"
          wrap="wrap"
          pt="8px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Button
            variant="plain"
            h="38px"
            px="12px"
            ms="-12px"
            gap="8px"
            color="#1F5AFF"
            fontSize="13px"
            fontWeight={600}
            lineHeight="19.5px"
            _hover={{ color: "#1646CC" }}
            asChild
          >
            <NextLink href={detailsHref}>
              {t("ServiceOrders.card.details")}
              <Icon as={LuArrowRight} boxSize="13px" />
            </NextLink>
          </Button>

          {isHeld ? (
            <Button
              variant="plain"
              h="38px"
              px="12px"
              borderWidth="1px"
              borderColor="#FECACA"
              rounded="10px"
              color="#EF4444"
              fontSize="13px"
              fontWeight={500}
              lineHeight="19.5px"
              _hover={{ bg: "#FEF2F2" }}
              onClick={onOpenDispute}
            >
              {t("ServiceOrders.item.openDispute")}
            </Button>
          ) : item.status === "completed" ? (
            <Flex
              align="center"
              gap="6px"
              h="38px"
              px="12px"
              bg="#EDFBF5"
              borderWidth="1px"
              borderColor="#AAECD5"
              rounded="10px"
              color="#10B981"
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
            >
              <Icon as={LuCircleCheck} boxSize="13px" aria-hidden />
              {t("ServiceOrders.item.completedChip")}
            </Flex>
          ) : isOpen ? (
            <Button
              variant="plain"
              h="38px"
              px="12px"
              gap="6px"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="10px"
              color="#5A6478"
              fontSize="13px"
              fontWeight={500}
              lineHeight="19.5px"
              _hover={{ bg: "#F4F6F9" }}
              onClick={onReschedule}
            >
              <Icon as={LuCalendar} boxSize="13px" />
              {t("ServiceOrders.item.reschedule", {
                count: remainingReschedules(item),
              })}
            </Button>
          ) : null}
        </Flex>
      </Stack>
    </Stack>
  );
}
