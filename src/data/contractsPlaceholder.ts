import type {
  Contract,
  ContractClause,
  ContractPayment,
  ContractPaymentStatus,
} from "@/types/contracts";
import type { Money } from "@/types/proposals";

// Contratos do design (Figma 2084-11698 e 2190-14094), usados até existir a
// API de contratos. Datas de cobrança, renovação e pagamentos são relativas a
// `now` para os prazos ("renova em 6d", "237d") fazerem sentido em qualquer
// dia. Ao ligar a API, o hook useContracts passa a buscar este mesmo formato.

const DAY = 24 * 60 * 60 * 1000;

const iso = (time: number) => new Date(time).toISOString();

/** Dia 1º do mês `offset` meses a partir de `now` (negativo = passado). */
function firstOfMonth(now: number, offset: number): string {
  const date = new Date(now);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1, 12),
  ).toISOString();
}

/** Mensalidades dos últimos meses, da mais recente à mais antiga. */
function monthlyPayments(
  now: number,
  amount: Money,
  firstInvoice: number,
  statuses: ContractPaymentStatus[],
): ContractPayment[] {
  return statuses.map((status, index) => {
    const invoiceNumber = `NF-${firstInvoice - index * 1150}`;
    return {
      id: invoiceNumber,
      dueDate: firstOfMonth(now, -index),
      invoiceNumber,
      amount,
      status,
    };
  });
}

/** Cláusulas padrão do contrato da plataforma (Figma 2190-14140). */
function standardClauses({
  productName,
  priceText,
  loyaltyText,
  slaText,
  exitFeeText,
}: {
  productName: string;
  priceText: string;
  loyaltyText: string;
  slaText: string;
  exitFeeText: string;
}): ContractClause[] {
  return [
    {
      title: "1. Objeto",
      body: `O presente contrato tem por objeto a prestação de serviço de ${productName} pelo Contratado (Seller) ao Contratante (Buyer), conforme especificações técnicas acordadas na plataforma Neutra+.`,
    },
    {
      title: "2. Prazo e Renovação",
      body: `Vigência de ${loyaltyText} contados da data de ativação. Renovação automática pelo mesmo prazo, salvo notificação contrária com 60 dias de antecedência.`,
    },
    {
      title: "3. Preço e Reajuste",
      body: `${priceText}. Reajuste anual pelo IPCA acumulado dos últimos 12 meses. Reajuste acima de IPCA+5pp faculta ao Contratante rescisão sem multa.`,
    },
    {
      title: "4. SLA e Penalidades",
      body: `Disponibilidade mínima garantida de ${slaText}. Em caso de violação, crédito proporcional ao downtime excedente será emitido no ciclo seguinte.`,
    },
    {
      title: "5. Multa Rescisória",
      body: `${exitFeeText} Seller também sujeito à multa no caso de cancelamento sem justa causa.`,
    },
    {
      title: "6. Foro",
      body: "Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer litígios, com renúncia expressa de qualquer outro, por mais privilegiado que seja.",
    },
  ];
}

export function placeholderContracts(now = Date.now()): Contract[] {
  const fiberPrice: Money = { amount: 109.99, currency: "BRL" };
  const ipv4Price: Money = { amount: 4420.04, currency: "USD" };
  const colocationPrice: Money = { amount: 2400, currency: "BRL" };
  const dedicatedPrice: Money = { amount: 3200, currency: "BRL" };

  return [
    {
      id: "CTR-2026-001",
      orderId: "ORD-2026-001",
      productName: "Internet Fibra Premium 500 Mbps",
      sellerName: "Russas Telecom",
      category: "connectivity",
      startDate: "2026-03-01T12:00:00.000Z",
      nextBillingDate: firstOfMonth(now, 1),
      renewsAt: iso(now + 237 * DAY),
      autoRenew: true,
      status: "active",
      price: fiberPrice,
      billingCycle: "monthly",
      slaPercent: 99.5,
      loyaltyMonths: 12,
      exitFee: { amount: 329.97, currency: "BRL" },
      adjustment: { index: "IPCA", rate: 3.2, appliedAt: "2026-05-01" },
      overdueInvoices: 0,
      clauses: standardClauses({
        productName: "Internet Fibra Premium 500 Mbps",
        priceText:
          "Mensalidade de R$ 109,99 (cento e nove reais e noventa e nove centavos)",
        loyaltyText: "12 (doze) meses",
        slaText: "99,5%",
        exitFeeText:
          "Rescisão antes do término da fidelidade implica multa de R$ 329,97 (três meses de mensalidade).",
      }),
      payments: monthlyPayments(now, fiberPrice, 88210, [
        "paid",
        "paid",
        "paid",
        "paid",
      ]),
      changeRequests: [
        {
          id: "CR-2026-014",
          description: "Aumentar velocidade para 1 Gbps no mesmo endereço.",
          requestedAt: iso(now - 3 * DAY),
          status: "pending",
        },
      ],
      cancellationRequested: false,
    },
    {
      id: "CTR-2026-002",
      orderId: "ORD-2026-007",
      productName: "Bloco IPv4 /24 — 256 IPs",
      sellerName: "Blinux IPA",
      category: "numberingResources",
      startDate: "2026-07-05T12:00:00.000Z",
      nextBillingDate: iso(now + 16 * DAY),
      renewsAt: iso(now + 250 * DAY),
      autoRenew: false,
      status: "active",
      price: ipv4Price,
      billingCycle: "yearly",
      slaPercent: 100,
      loyaltyMonths: 12,
      exitFee: null,
      adjustment: null,
      overdueInvoices: 0,
      clauses: standardClauses({
        productName: "Bloco IPv4 /24 — 256 IPs",
        priceText:
          "Anuidade de US$ 4.420,04 (quatro mil, quatrocentos e vinte dólares e quatro centavos)",
        loyaltyText: "12 (doze) meses",
        slaText: "100%",
        exitFeeText:
          "Rescisão não implica multa após a transferência do bloco junto ao registro regional.",
      }),
      payments: [
        {
          id: "NF-79012",
          dueDate: "2026-07-05T12:00:00.000Z",
          invoiceNumber: "NF-79012",
          amount: ipv4Price,
          status: "paid",
        },
      ],
      changeRequests: [],
      cancellationRequested: false,
    },
    {
      id: "CTR-2025-018",
      orderId: "ORD-2025-044",
      productName: "Colocation 2U Rack — SP Metro",
      sellerName: "CTS SFBM",
      category: "physicalInfra",
      startDate: "2025-07-01T12:00:00.000Z",
      nextBillingDate: firstOfMonth(now, 1),
      renewsAt: iso(now + 6 * DAY),
      autoRenew: true,
      status: "renewing",
      price: colocationPrice,
      billingCycle: "monthly",
      slaPercent: 99.95,
      loyaltyMonths: 12,
      exitFee: null,
      adjustment: { index: "IPCA", rate: 4.1, appliedAt: "2026-07-01" },
      overdueInvoices: 0,
      clauses: standardClauses({
        productName: "Colocation 2U Rack — SP Metro",
        priceText: "Mensalidade de R$ 2.400,00 (dois mil e quatrocentos reais)",
        loyaltyText: "12 (doze) meses",
        slaText: "99,95%",
        exitFeeText:
          "Rescisão antes do término da fidelidade implica multa de R$ 7.200,00 (três meses de mensalidade).",
      }),
      payments: monthlyPayments(now, colocationPrice, 88114, [
        "paid",
        "paid",
        "paid",
      ]),
      changeRequests: [],
      cancellationRequested: false,
    },
    {
      id: "CTR-2025-009",
      orderId: "ORD-2025-012",
      productName: "Link Dedicado 200 Mbps",
      sellerName: "Lemmos Telecom",
      category: "connectivity",
      startDate: "2025-01-01T12:00:00.000Z",
      nextBillingDate: null,
      renewsAt: iso(now + 60 * DAY),
      autoRenew: false,
      status: "suspended",
      price: dedicatedPrice,
      billingCycle: "monthly",
      slaPercent: 99.9,
      loyaltyMonths: 24,
      exitFee: { amount: 9600, currency: "BRL" },
      adjustment: { index: "IPCA", rate: 4.8, appliedAt: "2026-01-01" },
      overdueInvoices: 2,
      clauses: standardClauses({
        productName: "Link Dedicado 200 Mbps",
        priceText: "Mensalidade de R$ 3.200,00 (três mil e duzentos reais)",
        loyaltyText: "24 (vinte e quatro) meses",
        slaText: "99,9%",
        exitFeeText:
          "Rescisão antes do término da fidelidade implica multa de R$ 9.600,00 (três meses de mensalidade).",
      }),
      payments: monthlyPayments(now, dedicatedPrice, 87980, [
        "overdue",
        "overdue",
        "paid",
        "paid",
      ]),
      changeRequests: [],
      cancellationRequested: false,
    },
  ];
}
