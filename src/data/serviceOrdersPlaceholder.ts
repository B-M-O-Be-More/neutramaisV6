// Ordens de serviço do design (Figma 2191-24614, 3108-94102 e 2968-70307),
// enquanto a service-ordering-api não expõe técnicos, agenda, evidências e
// mensagens. As datas partem de `now` para os prazos de SLA fazerem sentido.

import type {
  ServiceOrder,
  ServiceOrderEvidence,
  ServiceOrderTechnician,
} from "@/types/serviceOrders";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const PLACEHOLDER_TECHNICIANS: ServiceOrderTechnician[] = [
  {
    id: "tec-1",
    name: "Pedro Ortega",
    phone: "(85) 99999-9999",
    specialty: "Fibra óptica e splicing",
  },
  {
    id: "tec-2",
    name: "Ricardo Mendes",
    phone: "(11) 98821-3040",
    specialty: "Redes e ativação",
  },
  {
    id: "tec-3",
    name: "Fernanda Lopes",
    phone: "(11) 97740-1182",
    specialty: "Datacenter e colocation",
  },
];

const [, RICARDO, FERNANDA] = PLACEHOLDER_TECHNICIANS;

/** Slots de evidência: os `done` primeiros já registrados. */
function evidences(
  total: number,
  done: number,
  at: string,
): ServiceOrderEvidence[] {
  return Array.from({ length: total }, (_, index) =>
    index < done
      ? { fileName: `evidencia-${index + 1}.jpg`, registeredAt: at }
      : {},
  );
}

export function placeholderServiceOrders(now: number): ServiceOrder[] {
  const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  return [
    {
      orderId: "ORD-2026-001",
      productName: "Internet Fibra Premium 500 Mbps",
      status: "inProgress",
      sellerName: "Russas Telecom",
      buyerName: "DataBridge Corp.",
      createdAt: at(-6 * DAY),
      amount: { amount: 109.99, currency: "BRL" },
      items: [
        {
          id: "OS-2026-0041",
          productName: "Internet Fibra Premium 500 Mbps",
          status: "inProgress",
          address: "Rua Voluntários da Pátria, 1250 — São Paulo/SP",
          location: { longitude: -46.6251, latitude: -23.5004 },
          technician: RICARDO,
          scheduledAt: at(2 * DAY),
          slaDeadline: at(47 * HOUR),
          updatedAt: at(-2 * HOUR),
          notes: "Acesso ao prédio liberado. Porteiro avisado.",
          evidences: evidences(3, 1, at(-90 * 60 * 1000)),
          reschedulesUsed: 0,
          reschedulesAllowed: 3,
          amount: { amount: 109.99, currency: "BRL" },
          messages: [
            {
              id: "msg-1",
              author: "seller",
              authorName: "Russas Telecom",
              sentAt: at(-3 * HOUR),
              text: "Bom dia! Técnico Ricardo confirmado para 09/07 das 09h às 12h.",
            },
            {
              id: "msg-2",
              author: "buyer",
              authorName: "DataBridge Corp.",
              sentAt: at(-150 * 60 * 1000),
              text: "Confirmado. O porteiro foi avisado. Pode trazer o material de splicing.",
            },
            {
              id: "msg-3",
              author: "system",
              authorName: "Neutra+ (Sistema)",
              sentAt: at(-90 * 60 * 1000),
              text: "Evidência 1/3 registrada pelo seller às 09:45.",
            },
          ],
        },
        {
          id: "OS-2026-0043",
          productName: "Vistoria técnica — Matriz",
          status: "completed",
          address: "Rua Voluntários da Pátria, 1250 — São Paulo/SP",
          location: { longitude: -46.6251, latitude: -23.5004 },
          technician: RICARDO,
          scheduledAt: at(-4 * DAY),
          slaDeadline: at(-3 * DAY),
          updatedAt: at(-4 * DAY),
          completedAt: at(-4 * DAY),
          notes: "Vistoria concluída. Rota de fibra liberada.",
          evidences: evidences(2, 2, at(-4 * DAY)),
          reschedulesUsed: 0,
          reschedulesAllowed: 3,
          amount: { amount: 350, currency: "BRL" },
          messages: [],
        },
        {
          id: "OS-2026-0044",
          productName: "Ativação — Filial Santana",
          status: "pending",
          address: "Av. Cruzeiro do Sul, 3200 — São Paulo/SP",
          location: { longitude: -46.6255, latitude: -23.5025 },
          scheduledAt: at(84 * DAY),
          postponedTo: at(84 * DAY),
          slaDeadline: at(90 * DAY),
          updatedAt: at(-DAY),
          notes: "Buyer pediu para ativar a filial só após a reforma.",
          evidences: evidences(2, 0, at(0)),
          reschedulesUsed: 1,
          reschedulesAllowed: 3,
          amount: { amount: 109.99, currency: "BRL" },
          messages: [],
        },
      ],
    },
    {
      orderId: "ORD-2026-002",
      productName: "Colocation 2U São Paulo Metro",
      status: "held",
      sellerName: "CTS SFBM",
      buyerName: "AlphaNet ISP",
      createdAt: at(-84 * DAY),
      responseDeadline: at(22 * HOUR),
      amount: { amount: 16800, currency: "BRL" },
      items: [
        {
          id: "OS-2026-0029",
          productName: "Colocation 2U — São Paulo Metro",
          status: "held",
          address: "Av. Paulista, 900 — Datacenter SP1 — São Paulo/SP",
          location: { longitude: -46.6527, latitude: -23.5649 },
          technician: FERNANDA,
          scheduledAt: at(-2 * DAY),
          slaDeadline: at(8 * HOUR),
          updatedAt: at(-3 * HOUR),
          notes:
            "HOLD: Acesso ao datacenter negado por segurança. Aguardando autorização do comprador.",
          evidences: evidences(2, 0, at(0)),
          reschedulesUsed: 1,
          reschedulesAllowed: 3,
          jeopardy: true,
          noShows: 1,
          amount: { amount: 16800, currency: "BRL" },
          messages: [
            {
              id: "msg-4",
              author: "system",
              authorName: "Neutra+ (Sistema)",
              sentAt: at(-3 * HOUR),
              text: "No-show registrado: acesso negado pela segurança do datacenter.",
            },
          ],
        },
      ],
    },
    {
      orderId: "ORD-2026-003",
      productName: "Bloco IPv4 /24 — Transferência assistida",
      status: "acknowledged",
      sellerName: "Blinux IPA",
      buyerName: "FastNet ISP",
      createdAt: at(-3 * DAY),
      amount: { amount: 4420.04, currency: "USD" },
      items: [
        {
          id: "OS-2026-0038",
          productName: "Bloco IPv4 /24 — Transferência assistida",
          status: "pending",
          address: "Digital (LACNIC/ANATEL)",
          remote: true,
          slaDeadline: at(163 * HOUR),
          updatedAt: at(-DAY),
          notes:
            "Aguardando documentação de titularidade enviada pelo comprador.",
          evidences: evidences(2, 0, at(0)),
          reschedulesUsed: 0,
          reschedulesAllowed: 3,
          amount: { amount: 4420.04, currency: "USD" },
          messages: [
            {
              id: "msg-5",
              author: "seller",
              authorName: "Blinux IPA",
              sentAt: at(-DAY),
              text: "Aguardando documentação de titularidade LACNIC. Prazo: 2 dias úteis após recebimento.",
            },
          ],
        },
      ],
    },
    {
      orderId: "ORD-2026-012",
      productName: "ONT Gpon 4 Portas WiFi 6 ×20",
      status: "completed",
      sellerName: "BRX Telecom",
      buyerName: "Conex Connect",
      createdAt: at(-12 * DAY),
      amount: { amount: 24500, currency: "BRL" },
      items: [
        {
          id: "OS-2026-0021",
          productName: "ONT Gpon 4 Portas WiFi 6 ×20",
          status: "completed",
          address: "Logística Nacional — Entrega via Correios",
          scheduledAt: at(-10 * DAY),
          slaDeadline: at(-7 * DAY),
          updatedAt: at(-9 * DAY),
          completedAt: at(-9 * DAY),
          notes: "Entregue com AR. Aceite técnico realizado pelo comprador.",
          evidences: evidences(3, 3, at(-9 * DAY)),
          reschedulesUsed: 0,
          reschedulesAllowed: 3,
          amount: { amount: 24500, currency: "BRL" },
          messages: [],
        },
      ],
    },
    {
      orderId: "ORD-2026-004",
      productName: "Link Dedicado 100 Mbps Full Duplex",
      status: "rejected",
      sellerName: "Conex Connect",
      buyerName: "Lemmos Telecom",
      createdAt: at(-7 * DAY),
      amount: { amount: 244.03, currency: "BRL" },
      items: [],
    },
    {
      orderId: "ORD-2026-005",
      productName: "ONT Gpon 4 Portas WiFi 6 ×5",
      status: "cancelled",
      creditIssued: true,
      sellerName: "BRX Telecom",
      buyerName: "Russas Telecom",
      createdAt: at(-13 * DAY),
      amount: { amount: 24500, currency: "BRL" },
      items: [],
    },
    {
      orderId: "ORD-2026-006",
      productName: "Fibra Dedicada 1 Gbps",
      status: "pending",
      sellerName: "Lemmos Telecom",
      buyerName: "DataBridge Corp.",
      createdAt: at(-83 * DAY),
      responseDeadline: at(20 * HOUR),
      amount: { amount: 38500, currency: "BRL" },
      items: [],
    },
  ];
}
