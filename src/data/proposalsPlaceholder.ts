import type { DirectProposal, Rfq } from "@/types/proposals";

// Propostas e RFQs do design (Figma 2036-13698), usadas até existir a
// rfq-api. As datas são relativas a `now` para os prazos ("18h restantes")
// fazerem sentido em qualquer dia. Ao ligar a API, os hooks
// useDirectProposals/useRfqs passam a buscar estes mesmos formatos.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const iso = (time: number) => new Date(time).toISOString();

export function placeholderDirectProposals(now = Date.now()): DirectProposal[] {
  return [
    {
      id: "PROP-D-001",
      version: 1,
      offeringId: "placeholder-speedline-200",
      seller: {
        name: "SpeedLine Telecom",
        taxId: "11.222.333/0001-44",
        kycVerified: true,
      },
      productName: "Link Dedicado 200 Mbps",
      category: "connectivity",
      price: { amount: 1850, currency: "BRL" },
      sla: "99,9% de disponibilidade",
      deliveryBusinessDays: 21,
      validityDays: 7,
      cancellationPolicy: "30 dias corridos, sem multa após 6 meses.",
      notes: "IP fixo incluso. Monitoramento 24/7. Instalação sem custo.",
      sentAt: iso(now - 1 * DAY - 3 * HOUR),
      expiresAt: iso(now + 6 * DAY),
      status: "awaiting",
      progress: 60,
    },
    {
      id: "PROP-D-002",
      version: 2,
      offeringId: "placeholder-alphanet-colo-2u",
      seller: {
        name: "AlphaNet ISP",
        taxId: "22.333.444/0001-55",
        kycVerified: true,
      },
      productName: "Colocation 2U — São Paulo",
      category: "physicalInfra",
      price: { amount: 980, currency: "BRL" },
      sla: "99,95% de disponibilidade elétrica",
      deliveryBusinessDays: 15,
      validityDays: 5,
      cancellationPolicy: "60 dias corridos, sem multa.",
      sentAt: iso(now - 2 * DAY - 5 * HOUR),
      expiresAt: iso(now + 3 * DAY),
      status: "revisionRequested",
      sellerMessage:
        "Preciso confirmar disponibilidade do espaço no Tier III. Poderia flexibilizar o prazo de entrega para 20 dias úteis?",
    },
    {
      id: "PROP-D-003",
      version: 1,
      offeringId: "placeholder-nexus-mpls-50",
      seller: {
        name: "Nexus Internet S.A.",
        taxId: "98.765.432/0001-11",
        kycVerified: true,
      },
      productName: "MPLS 50 Mbps — filial Fortaleza",
      category: "connectivity",
      price: { amount: 2100, currency: "BRL" },
      sla: "99,7% de disponibilidade",
      deliveryBusinessDays: 30,
      validityDays: 7,
      cancellationPolicy: "90 dias corridos, multa de 3 mensalidades.",
      sentAt: iso(now - 9 * DAY),
      expiresAt: iso(now - 2 * DAY),
      status: "accepted",
      progress: 100,
      orderId: "PED-2026-0412",
    },
    {
      id: "PROP-D-004",
      version: 1,
      offeringId: "placeholder-databridge-ipv4-24",
      seller: {
        name: "DataBridge Corp.",
        taxId: "33.444.555/0001-66",
        kycVerified: true,
      },
      productName: "Bloco IPv4 /24 (256 IPs)",
      category: "numberingResources",
      price: { amount: 4500, currency: "USD" },
      sla: "Transferência LACNIC em até 30 dias",
      deliveryBusinessDays: 30,
      validityDays: 10,
      cancellationPolicy: "Sem cancelamento após a transferência.",
      sentAt: iso(now - 12 * DAY),
      expiresAt: iso(now - 5 * DAY),
      status: "rejected",
      sellerMessage:
        "Bloco vendido para outro comprador antes do seu aceite. Posso oferecer um /25 (128 IPs) como alternativa.",
    },
    {
      id: "PROP-D-005",
      version: 1,
      offeringId: "placeholder-fastnet-ont-gpon",
      seller: {
        name: "FastNet ISP ME",
        taxId: "44.555.666/0001-77",
        kycVerified: true,
      },
      productName: "ONT Gpon 4 Portas x50 unidades",
      category: "hardware",
      price: { amount: 12000, currency: "BRL" },
      sla: "Garantia 12 meses de fábrica",
      deliveryBusinessDays: 10,
      validityDays: 3,
      cancellationPolicy: "Devolução em até 7 dias após o recebimento.",
      sentAt: iso(now - 17 * DAY),
      expiresAt: iso(now - 14 * DAY),
      status: "cancelled",
    },
  ];
}

export function placeholderRfqs(now = Date.now()): Rfq[] {
  const year = new Date(now).getFullYear();
  const created = (hoursAgo: number, responseHours: number) => ({
    createdAt: iso(now - hoursAgo * HOUR),
    deadlineAt: iso(now - hoursAgo * HOUR + responseHours * HOUR),
  });

  return [
    {
      id: `RFQ-${year}-001`,
      category: "connectivity",
      productName: "Link Dedicado 500 Mbps",
      description:
        "Link dedicado full duplex para matriz em São Paulo, necessidade de IP fixo e SLA 99,9%.",
      location: "São Paulo - SP",
      budget: "",
      responseHours: 72,
      urgent: false,
      requirements: "",
      ...created(54, 72),
      status: "proposalReceived",
      notifiedSellers: 12,
      proposalsReceived: 7,
      bestProposal: { amount: 2890, currency: "BRL" },
    },
    {
      id: `RFQ-${year}-002`,
      category: "physicalInfra",
      productName: "Colocation 4U Datacenter SP",
      description:
        "Espaço em rack 4U com energia redundante N+1 e refrigeração dedicada.",
      location: "São Paulo - SP",
      budget: "",
      responseHours: 72,
      urgent: false,
      requirements: "",
      ...created(28, 72),
      status: "awaiting",
      notifiedSellers: 6,
      proposalsReceived: 2,
    },
    {
      id: `RFQ-${year}-003`,
      category: "numberingResources",
      productName: "Bloco IPv4 /23 (512 IPs)",
      description:
        "Necessidade de bloco com transferência de titularidade via LACNIC.",
      location: "Fortaleza - CE",
      budget: "",
      responseHours: 72,
      urgent: false,
      requirements: "",
      ...created(10 * 24, 72),
      status: "converted",
      notifiedSellers: 4,
      proposalsReceived: 4,
      bestProposal: { amount: 8800, currency: "USD" },
      orderId: "PED-2026-0398",
    },
    {
      id: `RFQ-${year}-004`,
      category: "hardware",
      productName: "Roteadores Mikrotik RB4011 ×10",
      description:
        "Lote de 10 unidades com garantia mínima de 12 meses e nota fiscal.",
      location: "Russas - CE",
      budget: "",
      responseHours: 72,
      urgent: false,
      requirements: "",
      ...created(18 * 24, 72),
      status: "expired",
      notifiedSellers: 8,
      proposalsReceived: 0,
    },
    {
      id: `RFQ-${year}-005`,
      category: "physicalInfra",
      productName: "Fibra Dark Fiber 40km",
      description:
        "IRU de dark fiber entre São Paulo e Campinas, prazo mínimo 5 anos.",
      location: "São Paulo - SP / Campinas - SP",
      budget: "",
      responseHours: 72,
      urgent: false,
      requirements: "",
      ...created(4, 72),
      status: "awaiting",
      notifiedSellers: 3,
      proposalsReceived: 1,
    },
  ];
}
