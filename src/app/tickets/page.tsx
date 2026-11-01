"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMessageSquare, LuPlus } from "react-icons/lu";

import CollapsibleNotice from "@/components/CollapsibleNotice";
import AuthenticatedLayout from "@/components/Layouts/Authenticated";
import TicketCard from "@/components/TicketCard";
import TicketPriorityGuide from "@/components/TicketPriorityGuide";
import TicketsFilters from "@/components/TicketsFilters";
import TicketsStats from "@/components/TicketsStats";
import { toaster } from "@/components/ui/toaster";
import { TICKET_FILTER_STATUSES } from "@/data/ticketStatus";
import { currencyLocale } from "@/functions/currencyLocale";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTickets } from "@/hooks/useTickets";
import type { Ticket, TicketFilter } from "@/types/tickets";

function matchesFilter(ticket: Ticket, filter: TicketFilter): boolean {
  if (filter === "all") return true;
  if (filter === "mine") return ticket.openedByMe;
  return TICKET_FILTER_STATUSES[filter].includes(ticket.status);
}

function TicketsContent() {
  const { t, i18n } = useTranslation();
  const locale = currencyLocale(i18n.language);
  const { tickets, summary, now, pendingId, addComment } = useTickets();
  const [showNotice, setShowNotice] = React.useState(true);
  const [filter, setFilter] = React.useState<TicketFilter>("all");
  const [search, setSearch] = React.useState("");
  const query = useDebouncedValue(search.trim().toLowerCase(), 300);
  // O primeiro ticket já abre, como no design (Figma 3108-102282).
  const [expandedIds, setExpandedIds] = React.useState<string[]>(() =>
    tickets.slice(0, 1).map((ticket) => ticket.id),
  );

  const visibleTickets = tickets.filter(
    (ticket) =>
      matchesFilter(ticket, filter) &&
      (!query ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query)),
  );

  const toggleExpanded = (id: string) =>
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const handleComment = async (ticket: Ticket, comment: string) => {
    const ok = await addComment(ticket.id, comment);
    toaster.create(
      ok
        ? { type: "success", title: t("Tickets.toasts.commentSent") }
        : { type: "error", title: t("Tickets.toasts.actionFailed") },
    );
    return ok;
  };

  const list =
    visibleTickets.length === 0 ? (
      <Flex
        align="center"
        justify="center"
        minH="121px"
        px="24px"
        py="20px"
        bg="white"
        borderWidth="1px"
        borderColor="#E5E8EE"
        rounded="12px"
        textAlign="center"
      >
        <Text
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22.5px"
        >
          {t(
            query || filter !== "all"
              ? "Tickets.emptyFiltered"
              : "Tickets.empty",
          )}
        </Text>
      </Flex>
    ) : (
      <Stack gap="12px">
        {visibleTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            locale={locale}
            now={now}
            expanded={expandedIds.includes(ticket.id)}
            isPending={pendingId === ticket.id}
            onToggle={() => toggleExpanded(ticket.id)}
            onComment={(comment) => handleComment(ticket, comment)}
          />
        ))}
      </Stack>
    );

  return (
    <Stack
      maxW="1280px"
      px={{ base: 4, md: "32px" }}
      py={{ base: 6, md: "28px" }}
      gap="24px"
    >
      {showNotice && (
        <CollapsibleNotice
          tone="purple"
          icon={LuMessageSquare}
          title={t("Tickets.notice.title")}
          description={t("Tickets.notice.description")}
          labels={{
            collapse: t("Tickets.notice.collapse"),
            expand: t("Tickets.notice.expand"),
            dismiss: t("Tickets.notice.dismiss"),
          }}
          onDismiss={() => setShowNotice(false)}
        />
      )}

      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "flex-start", sm: "flex-start" }}
        justify="space-between"
        gap="16px"
      >
        <Stack gap="4px">
          <Text
            as="h1"
            color="#0F1729"
            fontSize="24px"
            fontWeight={800}
            lineHeight="36px"
          >
            {t("Tickets.title")}
          </Text>
          <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
            {t("Tickets.subtitle")}
          </Text>
        </Stack>
        <Button
          asChild
          h="auto"
          px="20px"
          py="10px"
          gap="8px"
          bg="#8B5CF6"
          rounded="12px"
          color="white"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
          flexShrink={0}
          boxShadow="0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)"
          _hover={{ bg: "#7C4DEB" }}
        >
          <NextLink href="/tickets/new">
            <Icon as={LuPlus} boxSize="15px" />
            {t("Tickets.open")}
          </NextLink>
        </Button>
      </Flex>

      <TicketPriorityGuide />

      <TicketsStats data={summary} locale={locale} />

      <TicketsFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {filter === "mine" ? (
        // "Meus Tickets" vem num painel com título (Figma 3108-102999).
        <Stack
          as="section"
          gap="14px"
          p="20px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="12px"
        >
          <Text
            as="h2"
            color="#0F1729"
            fontSize="12px"
            fontWeight={700}
            lineHeight="18px"
          >
            {t("Tickets.filters.mine")}
          </Text>
          {list}
        </Stack>
      ) : (
        list
      )}
    </Stack>
  );
}

// Central de suporte (Figma 3108-100267 e 3108-102332): prioridades e SLA,
// contadores, busca, abas e os tickets com comentário. A API de suporte
// ainda não existe — useTickets devolve os dados do design.
export default function TicketsPage() {
  return (
    <AuthenticatedLayout>
      <TicketsContent />
    </AuthenticatedLayout>
  );
}
