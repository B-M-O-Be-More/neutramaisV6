import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTickets } from "@/hooks/useTickets";

describe("useTickets", () => {
  it("conta abertos, críticos, resolvidos no mês e pré-venda", () => {
    const { result } = renderHook(() => useTickets());

    expect(result.current.summary).toEqual({
      open: 3,
      critical: 1,
      resolvedThisMonth: 1,
      presale: 1,
    });
  });

  it("comentar soma ao contador e atualiza a data", async () => {
    const { result } = renderHook(() => useTickets());
    const before = result.current.tickets.find(
      (ticket) => ticket.id === "TKT-2026-041",
    );

    await act(async () => {
      expect(
        await result.current.addComment(
          "TKT-2026-041",
          "Reagendado p/ amanhã.",
        ),
      ).toBe(true);
    });

    const after = result.current.tickets.find(
      (ticket) => ticket.id === "TKT-2026-041",
    );
    expect(after?.commentCount).toBe((before?.commentCount ?? 0) + 1);
    expect(new Date(after?.updatedAt ?? 0).getTime()).toBeGreaterThan(
      new Date(before?.updatedAt ?? 0).getTime(),
    );
  });

  it("não comenta em ticket resolvido ou encerrado", async () => {
    const { result } = renderHook(() => useTickets());

    await act(async () => {
      expect(await result.current.addComment("TKT-2026-029", "x")).toBe(false);
      expect(await result.current.addComment("TKT-2026-022", "x")).toBe(false);
    });
  });
});
