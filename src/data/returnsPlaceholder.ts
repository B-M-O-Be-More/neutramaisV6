import type { ReturnableOrder, ReturnRequest } from "@/types/returns";

// Devoluções do design (Figma 2943-31366), usadas até existir a API de
// devoluções. Os prazos do seller são relativos a `now` para "7h restantes"
// fazer sentido em qualquer dia. Ao ligar a API, o ReturnsContext passa a
// buscar este mesmo formato.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const iso = (time: number) => new Date(time).toISOString();

export function placeholderReturns(now = Date.now()): ReturnRequest[] {
  return [
    {
      id: "DEV-2026-018",
      orderId: "ORD-2026-090",
      productName: "ONT Gpon 4 Portas WiFi 6",
      quantity: 20,
      type: "exchange",
      reason: "wrongProduct",
      description:
        "Foram entregues modelos WiFi 5, divergentes da nota e do anúncio.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "BRX Telecom",
      amount: { amount: 98000, currency: "BRL" },
      status: "awaitingSeller",
      requestedAt: iso(now - 41 * HOUR),
      slaDeadline: iso(now + 7 * HOUR),
      attachments: [
        { id: "att-1", name: "foto_modelo_recebido.jpg", kind: "image" },
        { id: "att-2", name: "nota_fiscal.pdf", kind: "document" },
        { id: "att-3", name: "etiqueta_caixa.jpg", kind: "image" },
      ],
    },
    {
      id: "DEV-2026-016",
      orderId: "ORD-2026-088",
      productName: "ONT Gpon 4 Portas WiFi 6",
      quantity: 12,
      type: "exchange",
      reason: "defect",
      description: "Três unidades não sincronizam com a OLT após o reset.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "BRX Telecom",
      amount: { amount: 58800, currency: "BRL" },
      status: "receivedBySeller",
      requestedAt: iso(now - 3 * DAY),
      slaDeadline: iso(now + 7 * HOUR),
      attachments: [
        { id: "att-4", name: "log_olt.pdf", kind: "document" },
        { id: "att-5", name: "teste_bancada.mp4", kind: "video" },
      ],
    },
    {
      id: "DEV-2026-014",
      orderId: "ORD-2026-084",
      productName: "Roteador Wi-Fi 6 AX3000",
      quantity: 5,
      type: "return",
      reason: "transportDamage",
      description:
        "Duas unidades chegaram com a carcaça quebrada e sem funcionamento.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "BRX Telecom",
      amount: { amount: 4450, currency: "BRL" },
      status: "contested",
      requestedAt: iso(now - 2 * DAY),
      slaDeadline: iso(now + 19 * HOUR),
      attachments: [
        { id: "att-6", name: "avaria_01.jpg", kind: "image" },
        { id: "att-7", name: "avaria_02.jpg", kind: "image" },
        { id: "att-8", name: "video_unboxing.mp4", kind: "video" },
      ],
    },
    {
      id: "DEV-2026-011",
      orderId: "ORD-2026-079",
      productName: "Roteador Wi-Fi 6 AX3000",
      quantity: 5,
      type: "return",
      reason: "regret",
      description: "A compra foi duplicada pelo time de suprimentos.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "BRX Telecom",
      amount: { amount: 4450, currency: "BRL" },
      status: "rejected",
      requestedAt: iso(now - 9 * DAY),
      slaDeadline: null,
      attachments: [{ id: "att-9", name: "nota_fiscal.pdf", kind: "document" }],
    },
    {
      id: "DEV-2026-009",
      orderId: "ORD-2026-072",
      productName: "Switch 48 portas PoE",
      quantity: 1,
      type: "return",
      reason: "defect",
      description: "Oito portas PoE não entregam energia aos rádios.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "Conex Connect",
      amount: { amount: 7890, currency: "BRL" },
      status: "inMediation",
      requestedAt: iso(now - 12 * DAY),
      slaDeadline: null,
      attachments: [
        { id: "att-10", name: "portas_sem_poe.jpg", kind: "image" },
        { id: "att-11", name: "laudo_tecnico.pdf", kind: "document" },
      ],
    },
    {
      id: "DEV-2026-004",
      orderId: "ORD-2026-055",
      productName: "SFP+ 10G",
      quantity: 10,
      type: "exchange",
      reason: "defect",
      description: "Módulos sem link em 10G; só negociam 1G.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "Nexus Hardware",
      amount: { amount: 3200, currency: "BRL" },
      status: "returning",
      requestedAt: iso(now - 15 * DAY),
      slaDeadline: null,
      attachments: [{ id: "att-12", name: "teste_link.jpg", kind: "image" }],
    },
    {
      id: "DEV-2026-002",
      orderId: "ORD-2026-051",
      productName: "SFP+ 10G",
      quantity: 10,
      type: "exchange",
      reason: "defect",
      description: "Lote com DOM zerado em todas as unidades.",
      buyerName: "AlphaNet ISP ME",
      sellerName: "Nexus Hardware",
      amount: { amount: 3200, currency: "BRL" },
      status: "returnInTransit",
      requestedAt: iso(now - 20 * DAY),
      slaDeadline: null,
      attachments: [
        { id: "att-13", name: "leitura_dom.pdf", kind: "document" },
      ],
    },
  ];
}

/** Pedidos entregues que aceitam devolução (Figma 2943-31739). */
export function placeholderReturnableOrders(): ReturnableOrder[] {
  return [
    {
      id: "ORD-2026-101",
      productName: "Switch 48 portas PoE",
      quantity: 1,
      sellerName: "Conex Connect",
      buyerName: "AlphaNet ISP ME",
      amount: { amount: 7890, currency: "BRL" },
      receivedAt: "2026-07-06T12:00:00.000Z",
    },
  ];
}
