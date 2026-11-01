"use client";

import React from "react";

import { TICKET_ACTIVE_STATUSES } from "@/data/ticketStatus";
import { placeholderTickets } from "@/data/ticketsPlaceholder";
import type { Ticket, TicketsSummary } from "@/types/tickets";

import type { UseTicketsReturn } from "./interface";

/** Mesmo mês e ano de `now`. */
function isSameMonth(iso: string, now: number): boolean {
  const date = new Date(iso);
  const reference = new Date(now);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

/**
 * Tickets de suporte do usuário. A API de suporte ainda não existe: a lista
 * nasce dos dados do design e as ações alteram o estado local, com a mesma
 * assinatura assíncrona que as chamadas à API terão.
 */
export function useTickets(): UseTicketsReturn {
  const [now] = React.useState(() => Date.now());
  const [tickets, setTickets] = React.useState<Ticket[]>(() =>
    placeholderTickets(now),
  );
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const summary = React.useMemo<TicketsSummary>(() => {
    const active = tickets.filter((ticket) =>
      TICKET_ACTIVE_STATUSES.includes(ticket.status),
    );
    return {
      open: active.length,
      critical: active.filter((ticket) => ticket.priority === "P1").length,
      resolvedThisMonth: tickets.filter(
        (ticket) =>
          ticket.status === "resolved" && isSameMonth(ticket.updatedAt, now),
      ).length,
      presale: active.filter((ticket) => ticket.presale).length,
    };
  }, [tickets, now]);

  // O texto vai para a API (histórico do ticket); localmente só o contador e
  // a data de atualização mudam, então o comentário nem é lido aqui.
  const addComment = React.useCallback(
    async (id: string) => {
      const current = tickets.find((ticket) => ticket.id === id);
      if (!current || !TICKET_ACTIVE_STATUSES.includes(current.status)) {
        return false;
      }

      setPendingId(id);
      const updatedAt = new Date().toISOString();
      setTickets((list) =>
        list.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                commentCount: ticket.commentCount + 1,
                updatedAt,
              }
            : ticket,
        ),
      );
      setPendingId(null);
      return true;
    },
    [tickets],
  );

  return { tickets, summary, now, pendingId, addComment };
}
