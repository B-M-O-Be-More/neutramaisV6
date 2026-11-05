import { csvCell } from "@/functions/csvCell";
import type { Rfq } from "@/types/proposals";

/**
 * Uma RFQ em CSV ("Exportar" do card — Figma 2037-15640): cabeçalho e uma
 * linha, com chaves de categoria e status, datas ISO e valor com ponto
 * decimal, para abrir em planilha sem depender do idioma da interface.
 */
export function rfqToCsv(rfq: Rfq): string {
  const columns: [string, string | number][] = [
    ["id", rfq.id],
    ["product", rfq.productName],
    ["category", rfq.category],
    ["status", rfq.status],
    ["description", rfq.description],
    ["location", rfq.location],
    ["budget", rfq.budget],
    ["response_hours", rfq.responseHours],
    ["urgent", String(rfq.urgent)],
    ["requirements", rfq.requirements],
    ["created_at", rfq.createdAt],
    ["deadline_at", rfq.deadlineAt],
    ["notified_sellers", rfq.notifiedSellers],
    ["proposals_received", rfq.proposalsReceived],
    ["best_proposal", rfq.bestProposal?.amount.toFixed(2) ?? ""],
    ["currency", rfq.bestProposal?.currency ?? ""],
    ["order_id", rfq.orderId ?? ""],
  ];
  return [
    columns.map(([name]) => name).join(","),
    columns.map(([, value]) => csvCell(value)).join(","),
  ].join("\n");
}
