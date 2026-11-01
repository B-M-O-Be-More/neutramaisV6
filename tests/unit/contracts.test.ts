import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  formatAdjustment,
  formatBillingMonth,
  formatPercent,
} from "@/functions/contractFormat";
import { daysUntil, useContracts } from "@/hooks/useContracts";

const DAY = 24 * 60 * 60 * 1000;

describe("useContracts", () => {
  it("conta ativos, renovações, suspensos e aditivos pendentes", () => {
    const { result } = renderHook(() => useContracts());

    expect(result.current.summary).toEqual({
      active: 3,
      renewing: 1,
      suspended: 1,
      changeRequests: 1,
    });
  });

  it("aditivo entra como pendente, no topo, com o próximo ID do ano", async () => {
    const { result } = renderHook(() => useContracts());

    let request: Awaited<ReturnType<typeof result.current.requestAmendment>> =
      null;
    await act(async () => {
      request = await result.current.requestAmendment(
        "CTR-2026-002",
        "Trocar para um bloco /23.",
      );
    });

    const year = new Date().getFullYear();
    expect(request).toMatchObject({
      description: "Trocar para um bloco /23.",
      status: "pending",
    });
    expect(
      result.current.contracts.find((c) => c.id === "CTR-2026-002")
        ?.changeRequests[0],
    ).toEqual(request);
    expect(result.current.summary.changeRequests).toBe(2);
    // O placeholder já tem CR-2026-014; noutro ano a sequência recomeça.
    expect((request as { id: string } | null)?.id).toBe(
      year === 2026 ? "CR-2026-015" : `CR-${year}-001`,
    );
  });

  it("alterna a renovação automática", async () => {
    const { result } = renderHook(() => useContracts());

    await act(async () => {
      await result.current.toggleAutoRenew("CTR-2026-001");
    });

    expect(
      result.current.contracts.find((c) => c.id === "CTR-2026-001")?.autoRenew,
    ).toBe(false);
  });

  it("pede o cancelamento uma única vez", async () => {
    const { result } = renderHook(() => useContracts());

    await act(async () => {
      expect(await result.current.requestCancellation("CTR-2026-001")).toBe(
        true,
      );
    });
    await act(async () => {
      expect(await result.current.requestCancellation("CTR-2026-001")).toBe(
        false,
      );
    });

    const contract = result.current.contracts.find(
      (c) => c.id === "CTR-2026-001",
    );
    expect(contract).toMatchObject({
      cancellationRequested: true,
      status: "active",
    });
  });
});

describe("daysUntil", () => {
  it("arredonda para cima e zera no passado", () => {
    const now = Date.UTC(2026, 9, 31);
    expect(daysUntil(new Date(now + 5.2 * DAY).toISOString(), now)).toBe(6);
    expect(daysUntil(new Date(now - DAY).toISOString(), now)).toBe(0);
  });
});

describe("contractFormat", () => {
  it("formata o reajuste como no design", () => {
    expect(
      formatAdjustment(
        { index: "IPCA", rate: 3.2, appliedAt: "2026-05-01T12:00:00Z" },
        "pt-BR",
      ),
    ).toBe("IPCA +3,2% (mai/26)");
  });

  it("formata a competência e o percentual", () => {
    expect(formatBillingMonth("2026-06-01T12:00:00Z", "pt-BR")).toBe(
      "Jun/2026",
    );
    expect(formatPercent(99.5, "pt-BR")).toBe("99,5%");
  });
});
