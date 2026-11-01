"use client";

import { Box, chakra, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuClock, LuMessageSquare } from "react-icons/lu";

import FormTicketComment from "@/components/Forms/FormTicketComment";
import {
  TICKET_ACTIVE_STATUSES,
  TICKET_PRIORITY_STYLES,
  TICKET_SLA_URGENT_HOURS,
  TICKET_STATUS_STYLES,
} from "@/data/ticketStatus";
import { formatDateTime } from "@/functions/formatDateTime";
import { hoursUntil } from "@/functions/proposalFormat";

import { TicketCardProps } from "./interface";

/**
 * Ticket de suporte (Figma 3108-102282): prioridade, título, categoria e
 * referência, datas; status, SLA e comentários. Clicar abre a descrição, o
 * responsável e o campo de comentário.
 */
export function TicketCard({
  ticket,
  locale,
  now,
  expanded,
  isPending,
  onToggle,
  onComment,
}: TicketCardProps) {
  const { t } = useTranslation();
  const priority = TICKET_PRIORITY_STYLES[ticket.priority];
  const status = TICKET_STATUS_STYLES[ticket.status];
  const isActive = TICKET_ACTIVE_STATUSES.includes(ticket.status);
  const slaHours =
    isActive && ticket.slaDeadline ? hoursUntil(ticket.slaDeadline, now) : null;
  const detailsId = `ticket-${ticket.id}-details`;

  return (
    <Box
      as="article"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
      overflow="hidden"
    >
      <chakra.button
        type="button"
        display="flex"
        w="full"
        alignItems="flex-start"
        gap="12px"
        p="20px"
        textAlign="left"
        cursor="pointer"
        aria-expanded={expanded}
        aria-controls={detailsId}
        _hover={{ bg: "#FCFCFD" }}
        _focusVisible={{ outline: "2px solid #8B5CF6", outlineOffset: "-2px" }}
        onClick={onToggle}
      >
        <Flex
          boxSize="40px"
          align="center"
          justify="center"
          flexShrink={0}
          bg={priority.bg}
          rounded="12px"
          color={priority.color}
          fontSize="11px"
          fontWeight={800}
          lineHeight="16.5px"
          aria-label={t(`Tickets.priorities.${ticket.priority}.label`)}
        >
          {ticket.priority}
        </Flex>

        <Stack gap="2px" flex="1" minW={0}>
          <Flex align="center" gap="8px" wrap="wrap">
            <Text
              as="h2"
              color="#0F1729"
              fontSize="14px"
              fontWeight={700}
              lineHeight="21px"
            >
              {ticket.title}
            </Text>
            {ticket.presale && (
              <Text
                as="span"
                px="8px"
                py="2px"
                bg="#F3EEFF"
                borderWidth="1px"
                borderColor="#D3BFFD"
                rounded="6px"
                color="#8B5CF6"
                fontSize="9px"
                fontWeight={700}
                lineHeight="13.5px"
                whiteSpace="nowrap"
              >
                {t("Tickets.card.presale")}
              </Text>
            )}
          </Flex>
          <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
            {[
              ticket.id,
              t(`Tickets.categories.${ticket.category}`),
              ticket.reference &&
                t(`Tickets.references.${ticket.reference.kind}`, {
                  id: ticket.reference.id,
                }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
            {t("Tickets.card.dates", {
              opened: formatDateTime(ticket.openedAt, locale),
              updated: formatDateTime(ticket.updatedAt, locale),
            })}
          </Text>
        </Stack>

        <Stack gap="8px" align="flex-end" flexShrink={0}>
          <Flex
            align="center"
            gap="6px"
            px="10px"
            py="4px"
            bg={status.bg}
            rounded="8px"
            color={status.color}
          >
            <Icon as={status.icon} boxSize="11px" aria-hidden />
            <Text
              fontSize="11px"
              fontWeight={600}
              lineHeight="16.5px"
              whiteSpace="nowrap"
            >
              {t(`Tickets.statuses.${ticket.status}`)}
            </Text>
          </Flex>
          {slaHours !== null && (
            <Flex
              align="center"
              gap="4px"
              color={
                slaHours <= TICKET_SLA_URGENT_HOURS ? "#EF4444" : "#D97706"
              }
            >
              <Icon as={LuClock} boxSize="10px" aria-hidden />
              <Text fontSize="11px" fontWeight={600} lineHeight="16.5px">
                {t("Tickets.card.sla", { count: slaHours })}
              </Text>
            </Flex>
          )}
          <Flex
            align="center"
            gap="4px"
            color="#A0ABB8"
            aria-label={t("Tickets.card.comments", {
              count: ticket.commentCount,
            })}
          >
            <Icon as={LuMessageSquare} boxSize="10px" aria-hidden />
            <Text fontSize="11px" lineHeight="16.5px" aria-hidden>
              {ticket.commentCount}
            </Text>
          </Flex>
        </Stack>
      </chakra.button>

      {expanded && (
        <Stack
          id={detailsId}
          gap="16px"
          px="20px"
          py="16px"
          borderTopWidth="1px"
          borderColor="#F4F6F9"
        >
          <Stack
            gap="4px"
            p="16px"
            bg="#F8F9FB"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="8px"
          >
            <Text
              color="#A0ABB8"
              fontSize="9px"
              fontWeight={700}
              lineHeight="13.5px"
              letterSpacing="0.45px"
              textTransform="uppercase"
            >
              {t("Tickets.card.description")}
            </Text>
            <Text color="#0F1729" fontSize="13px" lineHeight="19.5px">
              {ticket.description}
            </Text>
          </Stack>

          <Text color="#A0ABB8" fontSize="12px" lineHeight="18px">
            {t("Tickets.card.assignee")}{" "}
            <Text as="span" color="#5A6478">
              {ticket.assignee}
            </Text>
          </Text>

          {isActive ? (
            <FormTicketComment
              id={`ticket-${ticket.id}`}
              isSubmitting={isPending}
              onSubmit={onComment}
            />
          ) : (
            <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
              {t("Tickets.card.closedNote")}
            </Text>
          )}
        </Stack>
      )}
    </Box>
  );
}
