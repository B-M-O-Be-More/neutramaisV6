import type { SellerRfq } from "@/types/sellerRfqs";

// RFQs recebidas do design (Figma 2948-52347), usadas até a rfq-api ter as
// regras de negócio. As datas são relativas a `now` para os prazos ("51h
// restantes") fazerem sentido em qualquer dia. Ao ligar a API, o hook
// useSellerRfqs passa a buscar este mesmo formato.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const iso = (time: number) => new Date(time).toISOString();

export function placeholderSellerRfqs(now = Date.now()): SellerRfq[] {
  const year = new Date(now).getFullYear();

  return [
    {
      id: `RFQ-${year}-EXT-041`,
      productName: "Link Dedicado 500 Mbps",
      buyer: { name: "DataBridge Corp.", taxId: "55.444.333/0001-22" },
      location: "Fortaleza/CE — Av. Santos Dumont, 3030",
      budget: "Até R$ 4.000,00/mês",
      description:
        "Link dedicado full duplex para escritório em Fortaleza/CE. IP fixo e SLA mínimo 99,9%.",
      receivedAt: iso(now - 21 * HOUR),
      deadlineAt: iso(now + 51 * HOUR),
      status: "awaiting",
    },
    {
      id: `RFQ-${year}-EXT-039`,
      productName: "Dark Fiber 80km",
      buyer: { name: "FastNet ISP ME", taxId: "77.888.999/0001-55" },
      location: "Fortaleza/CE — Caucaia/CE (80km)",
      description:
        "IRU de dark fiber entre Fortaleza e Caucaia. Prazo mínimo 5 anos. Entrega até setembro/2026.",
      receivedAt: iso(now - 2 * DAY),
      deadlineAt: iso(now + 1 * DAY),
      status: "proposalSent",
      proposal: {
        price: { amount: 28000, currency: "BRL" },
        sla: "99,5%",
        deliveryDays: 90,
        validityDays: 15,
        requiresSiteSurvey: true,
        notes: "",
        version: 1,
      },
    },
    {
      id: `RFQ-${year}-EXT-036`,
      productName: "Dark Fiber 80km",
      buyer: { name: "FastNet ISP ME", taxId: "77.888.999/0001-55" },
      location: "Fortaleza/CE — Caucaia/CE (80km)",
      description:
        "IRU de dark fiber entre Fortaleza e Caucaia. Prazo mínimo 5 anos. Entrega até setembro/2026.",
      receivedAt: iso(now - 6 * DAY),
      deadlineAt: iso(now - 3 * DAY),
      status: "converted",
      proposal: {
        price: { amount: 28000, currency: "BRL" },
        sla: "99,5%",
        deliveryDays: 90,
        validityDays: 15,
        requiresSiteSurvey: true,
        notes: "",
        version: 1,
      },
      orderId: `ORD-${year}-101`,
    },
    {
      id: `RFQ-${year}-EXT-031`,
      productName: "MPLS 100 Mbps — 3 filiais",
      buyer: { name: "Nexus Internet S.A.", taxId: "98.765.432/0001-11" },
      location: "São Paulo/SP · Rio de Janeiro/RJ · Fortaleza/CE",
      description:
        "MPLS interligando as filiais de São Paulo, Rio de Janeiro e Fortaleza, com QoS para voz.",
      receivedAt: iso(now - 9 * DAY),
      deadlineAt: iso(now - 6 * DAY),
      status: "converted",
      proposal: {
        price: { amount: 12500, currency: "BRL" },
        sla: "99,7%",
        deliveryDays: 45,
        validityDays: 30,
        requiresSiteSurvey: false,
        notes: "",
        version: 2,
      },
      orderId: `ORD-${year}-094`,
    },
    {
      id: `RFQ-${year}-EXT-028`,
      productName: "Colocation 10U SP2",
      buyer: { name: "AlphaNet ISP", taxId: "33.222.111/0001-44" },
      location: "São Paulo/SP",
      description:
        "Espaço de 10U em rack no datacenter SP2, com energia redundante e cross-connect.",
      receivedAt: iso(now - 12 * DAY),
      deadlineAt: iso(now - 9 * DAY),
      status: "declined",
      declineReason:
        "Sem capacidade disponível no SP2 até o próximo trimestre.",
    },
    {
      id: `RFQ-${year}-EXT-022`,
      productName: "Fibra Atacado 300 Mbps x500",
      buyer: { name: "SpeedLine Telecom", taxId: "11.222.333/0001-44" },
      location: "Russas/CE",
      description:
        "Lote de 500 acessos de fibra atacado 300 Mbps para revenda em Russas/CE.",
      receivedAt: iso(now - 18 * DAY),
      deadlineAt: iso(now - 15 * DAY),
      status: "expired",
    },
  ];
}
