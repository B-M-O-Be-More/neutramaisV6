import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDirectProposals } from "@/hooks/useDirectProposals";
import { useRfqs } from "@/hooks/useRfqs";
import type { RfqDraft } from "@/types/proposals";

const REVISION = {
  price: 1700,
  sla: "99,95% de disponibilidade",
  deliveryBusinessDays: 20,
  cancellationPolicy: "30 dias corridos.",
  notes: "",
};

describe("useDirectProposals", () => {
  it("revisar gera a próxima versão e volta a aguardar o seller", async () => {
    const { result } = renderHook(() => useDirectProposals());

    let revised: Awaited<ReturnType<typeof result.current.revise>> = null;
    await act(async () => {
      revised = await result.current.revise("PROP-D-002", REVISION);
    });

    expect(revised).toMatchObject({
      id: "PROP-D-002",
      version: 3,
      status: "awaiting",
      price: { amount: 1700, currency: "BRL" },
      sellerMessage: undefined,
    });
    expect(result.current.counts.revisionRequested).toBe(0);
    expect(result.current.counts.awaiting).toBe(2);
  });

  it("não revisa nem cancela proposta já aceita", async () => {
    const { result } = renderHook(() => useDirectProposals());

    await act(async () => {
      expect(await result.current.revise("PROP-D-003", REVISION)).toBeNull();
      expect(await result.current.cancel("PROP-D-003", "other", "")).toBe(
        false,
      );
    });

    expect(
      result.current.proposals.find((p) => p.id === "PROP-D-003")?.status,
    ).toBe("accepted");
  });

  it("cancela proposta em aberto", async () => {
    const { result } = renderHook(() => useDirectProposals());

    await act(async () => {
      expect(
        await result.current.cancel("PROP-D-001", "budgetRevised", ""),
      ).toBe(true);
    });

    expect(result.current.counts.cancelled).toBe(2);
  });
});

describe("useRfqs", () => {
  const DRAFT: RfqDraft = {
    category: "connectivity",
    productName: "Link Dedicado 1 Gbps",
    description: "Link para a filial.",
    location: "Russas - CE",
    budget: "",
    responseHours: 24,
    urgent: true,
    requirements: "",
  };

  it("cria a RFQ com o próximo ID e o prazo de resposta escolhido", async () => {
    const { result } = renderHook(() => useRfqs());
    const year = new Date().getFullYear();
    expect(result.current.nextId).toBe(`RFQ-${year}-006`);

    await act(async () => {
      const rfq = await result.current.create(DRAFT);
      expect(rfq.id).toBe(`RFQ-${year}-006`);
      expect(rfq.status).toBe("awaiting");
      expect(
        new Date(rfq.deadlineAt).getTime() - new Date(rfq.createdAt).getTime(),
      ).toBe(24 * 3_600_000);
    });

    expect(result.current.rfqs[0].productName).toBe(DRAFT.productName);
    expect(result.current.nextId).toBe(`RFQ-${year}-007`);
  });

  it("cancela em lote só as RFQs que ainda não viraram pedido", async () => {
    const { result } = renderHook(() => useRfqs());
    const year = new Date().getFullYear();

    let cancelled = 0;
    await act(async () => {
      cancelled = await result.current.cancel([
        `RFQ-${year}-001`,
        `RFQ-${year}-002`,
        `RFQ-${year}-003`,
      ]);
    });

    expect(cancelled).toBe(2);
    expect(result.current.counts.cancelled).toBe(2);
    expect(result.current.counts.converted).toBe(1);
  });
});
