import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SellerServiceOrdersProvider,
  useSellerServiceOrders,
} from "@/contexts/SellerServiceOrdersContext";

import { act, renderHook } from "../test-utils";

function wrapper({ children }: { children: ReactNode }) {
  return <SellerServiceOrdersProvider>{children}</SellerServiceOrdersProvider>;
}

const renderOrders = () =>
  renderHook(() => useSellerServiceOrders(), { wrapper });

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("SellerServiceOrdersContext", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:evidence");
    URL.revokeObjectURL = vi.fn();
  });

  it("técnico + iniciar agora: a OS e a ordem passam a em execução", async () => {
    const { result } = renderOrders();
    // OS-2026-0038 (Bloco IPv4) está pendente e sem técnico; a ordem, aceita.
    expect(
      result.current.findItem("ORD-2026-003", "OS-2026-0038")?.order,
    ).toMatchObject({ status: "acknowledged" });

    await act(async () => {
      await result.current.startItem("OS-2026-0038");
    });
    // Sem técnico não inicia.
    expect(
      result.current.findItem("ORD-2026-003", "OS-2026-0038")?.item.status,
    ).toBe("pending");

    await act(async () => {
      await result.current.assignTechnician(
        "OS-2026-0038",
        { name: "Ana Lima", phone: "(85) 98888-7777", specialty: "IP" },
        true,
      );
    });

    const found = result.current.findItem("ORD-2026-003", "OS-2026-0038");
    expect(found?.item).toMatchObject({
      status: "inProgress",
      technician: { name: "Ana Lima" },
    });
    expect(found?.order.status).toBe("inProgress");
    expect(found?.item.messages.at(-1)).toMatchObject({
      author: "system",
      text: "ServiceOrders.chat.technicianStarted",
    });
    // O técnico novo entra na equipe para as próximas OS.
    expect(result.current.technicians.map((tech) => tech.name)).toContain(
      "Ana Lima",
    );
  });

  it("só adicionar mantém a OS pendente até iniciar", async () => {
    const { result } = renderOrders();

    await act(async () => {
      await result.current.assignTechnician("OS-2026-0038", "tec-1", false);
    });
    expect(
      result.current.findItem("ORD-2026-003", "OS-2026-0038")?.item,
    ).toMatchObject({ status: "pending", technician: { id: "tec-1" } });

    await act(async () => {
      await result.current.startItem("OS-2026-0038");
    });
    expect(
      result.current.findItem("ORD-2026-003", "OS-2026-0038")?.item.status,
    ).toBe("inProgress");
  });

  it("concluir só depois de registrar todas as evidências", async () => {
    const { result } = renderOrders();
    // OS-2026-0041: em execução com 1/3 evidências.
    let completed = null;
    await act(async () => {
      completed = await result.current.completeItem("OS-2026-0041");
    });
    expect(completed).toBeNull();

    await act(async () => {
      await result.current.registerEvidence("OS-2026-0041", 1, file("a.jpg"));
    });
    await act(async () => {
      await result.current.registerEvidence("OS-2026-0041", 2, file("b.jpg"));
    });
    // Slot já registrado não é sobrescrito.
    let again = null;
    await act(async () => {
      again = await result.current.registerEvidence(
        "OS-2026-0041",
        0,
        file("c.jpg"),
      );
    });
    expect(again).toBeNull();

    await act(async () => {
      completed = await result.current.completeItem("OS-2026-0041");
    });
    expect(completed).toMatchObject({ status: "completed" });
    expect(
      result.current.findItem("ORD-2026-001", "OS-2026-0041")?.item.evidences,
    ).toMatchObject([
      { fileName: "evidencia-1.jpg" },
      { fileName: "a.jpg", url: "blob:evidence" },
      { fileName: "b.jpg", url: "blob:evidence" },
    ]);
  });

  it("adiar muda a agenda; reagendar consome um dos permitidos", async () => {
    const { result } = renderOrders();

    await act(async () => {
      await result.current.postpone("OS-2026-0041", {
        scheduledAt: "2030-01-10T09:00",
        reason: "Chuva forte",
        reschedule: true,
        rescheduleType: "internal",
        rescheduleReason: "Equipe realocada",
      });
    });

    const item = result.current.findItem("ORD-2026-001", "OS-2026-0041")?.item;
    expect(item?.reschedulesUsed).toBe(1);
    expect(item?.scheduledAt).toBe(new Date("2030-01-10T09:00").toISOString());
    expect(item?.postponedTo).toBe(item?.scheduledAt);
  });

  it("envia mensagem do seller e ignora texto vazio", async () => {
    const { result } = renderOrders();

    let ok = true;
    await act(async () => {
      ok = await result.current.sendMessage("OS-2026-0041", "   ");
    });
    expect(ok).toBe(false);

    await act(async () => {
      ok = await result.current.sendMessage("OS-2026-0041", " Chego às 9h ");
    });
    expect(ok).toBe(true);
    expect(
      result.current
        .findItem("ORD-2026-001", "OS-2026-0041")
        ?.item.messages.at(-1),
    ).toMatchObject({
      author: "seller",
      authorName: "Russas Telecom",
      text: "Chego às 9h",
    });
  });
});
