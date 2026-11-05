import { describe, expect, it } from "vitest";

import { csvCell } from "@/functions/csvCell";
import { rfqToCsv } from "@/functions/rfqCsv";
import type { Rfq } from "@/types/proposals";

const RFQ: Rfq = {
  id: "RFQ-2024-001",
  category: "connectivity",
  productName: "Link Dedicado 500 Mbps",
  description: "Full duplex, IP fixo e SLA 99,9%.",
  location: "São Paulo/SP",
  budget: "",
  responseHours: 72,
  urgent: false,
  requirements: 'NDA "padrão"',
  createdAt: "2026-07-05T12:00:00.000Z",
  deadlineAt: "2026-07-08T12:00:00.000Z",
  status: "proposalReceived",
  notifiedSellers: 12,
  proposalsReceived: 7,
  bestProposal: { amount: 2890, currency: "BRL" },
};

describe("rfqToCsv (Exportar do card da RFQ)", () => {
  it("gera cabeçalho e uma linha, com chaves e valores sem formatação", () => {
    const [header, row, ...rest] = rfqToCsv(RFQ).split("\n");

    expect(rest).toEqual([]);
    expect(header).toBe(
      "id,product,category,status,description,location,budget,response_hours,urgent,requirements,created_at,deadline_at,notified_sellers,proposals_received,best_proposal,currency,order_id",
    );
    expect(row).toBe(
      [
        "RFQ-2024-001",
        "Link Dedicado 500 Mbps",
        "connectivity",
        "proposalReceived",
        '"Full duplex, IP fixo e SLA 99,9%."',
        "São Paulo/SP",
        "",
        "72",
        "false",
        '"NDA ""padrão"""',
        "2026-07-05T12:00:00.000Z",
        "2026-07-08T12:00:00.000Z",
        "12",
        "7",
        "2890.00",
        "BRL",
        "",
      ].join(","),
    );
  });

  it("sem proposta, melhor proposta e moeda ficam vazias", () => {
    const row = rfqToCsv({
      ...RFQ,
      status: "awaiting",
      bestProposal: undefined,
    }).split("\n")[1];

    expect(row.endsWith(",,,")).toBe(true);
  });

  it("csvCell só põe aspas quando precisa", () => {
    expect(csvCell("simples")).toBe("simples");
    expect(csvCell(12)).toBe("12");
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("linha\nquebrada")).toBe('"linha\nquebrada"');
  });
});
