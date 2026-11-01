import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ReturnsProvider, useReturns } from "@/contexts/ReturnsContext";
import { isReturnSlaUrgent, returnSlaHours } from "@/functions/returnSla";

const HOUR = 60 * 60 * 1000;

const wrapper = ({ children }: { children: ReactNode }) => (
  <ReturnsProvider>{children}</ReturnsProvider>
);

describe("ReturnsContext", () => {
  it("conta total, aguardando ação, contestadas e em retorno", () => {
    const { result } = renderHook(() => useReturns(), { wrapper });

    expect(result.current.summary).toEqual({
      total: 7,
      awaitingAction: 3,
      contested: 2,
      returning: 2,
    });
  });

  it("nova solicitação entra no topo aguardando o seller, com prazo de 48h", async () => {
    const { result } = renderHook(() => useReturns(), { wrapper });
    const file = new File(["x"], "caixa.jpg", { type: "image/jpeg" });

    let created: Awaited<ReturnType<typeof result.current.createReturn>> = null;
    await act(async () => {
      created = await result.current.createReturn("ORD-2026-101", {
        type: "exchange",
        reason: "defect",
        description: "Portas PoE sem energia.",
        files: [file],
      });
    });

    expect(created).toMatchObject({
      orderId: "ORD-2026-101",
      productName: "Switch 48 portas PoE",
      type: "exchange",
      status: "awaitingSeller",
      attachments: [{ name: "caixa.jpg", kind: "image" }],
    });
    expect(result.current.returns[0]).toEqual(created);
    expect(result.current.summary.total).toBe(8);
    const deadline = new Date(
      (created as { slaDeadline: string } | null)?.slaDeadline ?? 0,
    ).getTime();
    expect(Math.round((deadline - Date.now()) / HOUR)).toBe(48);
  });

  it("não abre devolução para pedido desconhecido", async () => {
    const { result } = renderHook(() => useReturns(), { wrapper });

    await act(async () => {
      expect(
        await result.current.createReturn("ORD-0000-000", {
          type: "return",
          reason: "other",
          description: "x",
          files: [],
        }),
      ).toBeNull();
    });
  });

  it("só contestada ou recusada vai à mediação", async () => {
    const { result } = renderHook(() => useReturns(), { wrapper });

    await act(async () => {
      expect(await result.current.requestMediation("DEV-2026-018")).toBe(false);
      expect(await result.current.requestMediation("DEV-2026-014")).toBe(true);
    });

    expect(
      result.current.returns.find((item) => item.id === "DEV-2026-014"),
    ).toMatchObject({ status: "inMediation", slaDeadline: null });
  });
});

describe("returnSla", () => {
  const now = Date.UTC(2026, 9, 31, 12);
  const deadline = new Date(now + 7 * HOUR).toISOString();

  it("só corre prazo enquanto o seller precisa responder", () => {
    expect(
      returnSlaHours({ status: "awaitingSeller", slaDeadline: deadline }, now),
    ).toBe(7);
    expect(
      returnSlaHours({ status: "inMediation", slaDeadline: deadline }, now),
    ).toBeNull();
  });

  it("vermelho até 12h, âmbar depois", () => {
    expect(isReturnSlaUrgent(7)).toBe(true);
    expect(isReturnSlaUrgent(19)).toBe(false);
  });
});
