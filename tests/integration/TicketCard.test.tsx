import { describe, expect, it, vi } from "vitest";

import TicketCard from "@/components/TicketCard";
import type { Ticket } from "@/types/tickets";

import { renderWithProviders, screen, waitFor } from "../test-utils";

const NOW = Date.UTC(2026, 6, 7, 12);

const TICKET: Ticket = {
  id: "TKT-2026-041",
  title: "Falha na ativação — Fibra Premium 500 Mbps",
  description: "Técnico não conseguiu realizar o splicing no ponto A.",
  priority: "P1",
  category: "provisioning",
  status: "inProgress",
  presale: false,
  reference: { kind: "order", id: "ORD-2026-001" },
  assignee: "Suporte Técnico Neutra+",
  openedAt: new Date(NOW - 4 * 3600_000).toISOString(),
  updatedAt: new Date(NOW - 3600_000).toISOString(),
  slaDeadline: new Date(NOW + 2 * 3600_000).toISOString(),
  commentCount: 5,
  openedByMe: false,
};

function renderCard(ticket: Ticket = TICKET) {
  const onComment = vi.fn().mockResolvedValue(true);
  const onToggle = vi.fn();
  const result = renderWithProviders(
    <TicketCard
      ticket={ticket}
      locale="pt-BR"
      now={NOW}
      expanded
      isPending={false}
      onToggle={onToggle}
      onComment={onComment}
    />,
  );
  return { ...result, onComment, onToggle };
}

describe("TicketCard", { timeout: 20_000 }, () => {
  it("exige texto e envia o comentário, limpando o campo", async () => {
    const { user, onComment } = renderCard();

    const field = screen.getByLabelText("Tickets.comment.label");
    await user.click(
      screen.getByRole("button", { name: "Tickets.comment.submit" }),
    );
    expect(
      await screen.findByText("Tickets.errors.commentRequired"),
    ).toBeVisible();
    expect(onComment).not.toHaveBeenCalled();

    await user.type(field, "Reagendado para amanhã às 9h.");
    await user.click(
      screen.getByRole("button", { name: "Tickets.comment.submit" }),
    );

    await waitFor(() =>
      expect(onComment).toHaveBeenCalledWith("Reagendado para amanhã às 9h."),
    );
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("ticket encerrado não aceita comentário", () => {
    renderCard({ ...TICKET, status: "closed", slaDeadline: null });

    expect(
      screen.queryByLabelText("Tickets.comment.label"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Tickets.card.closedNote")).toBeVisible();
  });

  it("o cabeçalho abre e fecha o ticket", async () => {
    const { user, onToggle } = renderCard();

    const header = screen.getByRole("button", { expanded: true });
    await user.click(header);
    expect(onToggle).toHaveBeenCalled();
  });
});
