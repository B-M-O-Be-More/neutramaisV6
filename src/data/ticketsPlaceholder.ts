import type { Ticket } from "@/types/tickets";

// Tickets do design (Figma 3108-100267), usados até existir a API de suporte.
// SLA e datas são relativos a `now` para "SLA: 2h" fazer sentido em qualquer
// dia. Ao ligar a API, o hook useTickets passa a buscar este mesmo formato.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const iso = (time: number) => new Date(time).toISOString();

export function placeholderTickets(now = Date.now()): Ticket[] {
  return [
    {
      id: "TKT-2026-041",
      title: "Falha na ativação — Fibra Premium 500 Mbps",
      description:
        "Técnico compareceu mas não conseguiu realizar o splicing no ponto A. Aguardando reagendamento.",
      priority: "P1",
      category: "provisioning",
      status: "inProgress",
      presale: false,
      reference: { kind: "order", id: "ORD-2026-001" },
      assignee: "Suporte Técnico Neutra+",
      openedAt: iso(now - 2 * HOUR),
      updatedAt: iso(now - 15 * 60 * 1000),
      slaDeadline: iso(now + 2 * HOUR),
      commentCount: 5,
      openedByMe: false,
    },
    {
      id: "TKT-2026-038",
      title: "Dúvida geral — documentação de Colocation",
      description:
        "Preciso da documentação técnica do rack (dimensões, energia redundante e acesso) antes de fechar a contratação.",
      priority: "P4",
      category: "generalQuestion",
      status: "awaitingSeller",
      presale: true,
      reference: { kind: "offer", id: "OFR-CTS-002" },
      assignee: "CTS SFBM",
      openedAt: iso(now - 27 * HOUR),
      updatedAt: iso(now - 8 * HOUR),
      slaDeadline: iso(now + 45 * HOUR),
      commentCount: 3,
      openedByMe: true,
    },
    {
      id: "TKT-2026-035",
      title: "SLA abaixo do contratado — Link Dedicado",
      description:
        "Disponibilidade medida em 98,7% no mês, abaixo dos 99,9% contratados. Solicito análise e crédito proporcional.",
      priority: "P2",
      category: "slaQuality",
      status: "inProgress",
      presale: false,
      reference: { kind: "order", id: "ORD-2026-021" },
      assignee: "Suporte Técnico Neutra+",
      openedAt: iso(now - 18 * HOUR),
      updatedAt: iso(now - 3 * HOUR),
      slaDeadline: iso(now + 6 * HOUR),
      commentCount: 8,
      openedByMe: false,
    },
    {
      id: "TKT-2026-029",
      title: "Dúvida sobre renovação automática do contrato",
      description:
        "Quero confirmar o prazo para desativar a renovação automática sem multa.",
      priority: "P3",
      category: "contracts",
      status: "resolved",
      presale: false,
      reference: { kind: "contract", id: "CTR-2025-018" },
      assignee: "Atendimento Comercial Neutra+",
      openedAt: iso(now - 6 * DAY),
      // Resolvido há pouco: conta em "Resolvidos (mês)" em qualquer dia.
      updatedAt: iso(now - 1 * HOUR),
      slaDeadline: null,
      commentCount: 4,
      openedByMe: false,
    },
    {
      id: "TKT-2026-022",
      title: "Nota fiscal incorreta — Pedido IPv4",
      description:
        "A NF saiu com o CNPJ da filial em vez da matriz. Solicito cancelamento e reemissão.",
      priority: "P2",
      category: "fiscal",
      status: "closed",
      presale: false,
      reference: { kind: "order", id: "ORD-2026-003" },
      assignee: "Financeiro Neutra+",
      openedAt: iso(now - 40 * DAY),
      updatedAt: iso(now - 39 * DAY),
      slaDeadline: null,
      commentCount: 6,
      openedByMe: false,
    },
  ];
}
