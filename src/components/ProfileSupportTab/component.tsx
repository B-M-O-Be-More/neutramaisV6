"use client";

import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

import ProfileCard from "@/components/ProfileCard";
import TicketCard from "@/components/TicketCard";
import { TICKET_ACTIVE_STATUSES } from "@/data/ticketStatus";
import { useTickets } from "@/hooks/useTickets";

import { ProfileSupportTabProps } from "./interface";

/**
 * Aba "Suporte" (Figma 3100-48014): os tickets em atendimento abertos pelo
 * usuário e o atalho para abrir um novo.
 */
export function ProfileSupportTab({
  locale,
  newTicketHref,
}: ProfileSupportTabProps) {
  const { t } = useTranslation();
  const { tickets, now, pendingId, addComment } = useTickets();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const mine = tickets.filter(
    (ticket) =>
      ticket.openedByMe && TICKET_ACTIVE_STATUSES.includes(ticket.status),
  );

  return (
    <Stack gap="20px">
      {mine.length === 0 ? (
        <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
          {t("Profile.support.empty")}
        </Text>
      ) : (
        <Stack gap="12px" aria-label={t("Profile.support.ticketsLabel")}>
          {mine.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              locale={locale}
              now={now}
              expanded={expandedId === ticket.id}
              isPending={pendingId === ticket.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === ticket.id ? null : ticket.id,
                )
              }
              onComment={(comment) => addComment(ticket.id, comment)}
            />
          ))}
        </Stack>
      )}

      <ProfileCard title={t("Profile.support.helpTitle")}>
        <Flex justify="flex-end">
          <Button
            asChild
            h="36px"
            px="16px"
            bg="#1F5AFF"
            rounded="14px"
            color="white"
            fontSize="12px"
            fontWeight={700}
            _hover={{ bg: "#1A4FE0" }}
          >
            <NextLink href={newTicketHref}>
              {t("Profile.support.openTicket")}
            </NextLink>
          </Button>
        </Flex>
      </ProfileCard>
    </Stack>
  );
}
