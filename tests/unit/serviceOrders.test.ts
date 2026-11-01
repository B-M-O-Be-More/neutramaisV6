import { describe, expect, it } from "vitest";

import { placeholderServiceOrders } from "@/data/serviceOrdersPlaceholder";
import {
  canCompleteServiceOrderItem,
  canStartServiceOrderItem,
  daysSince,
  daysUntil,
  matchesServiceOrderSearch,
  remainingReschedules,
  serviceOrderDisplayStatus,
  serviceOrderEvidenceProgress,
  serviceOrderItemDisplayStatus,
  serviceOrderProgressIndex,
  summarizeServiceOrderItems,
  summarizeServiceOrders,
} from "@/functions/serviceOrders";
import {
  serviceOrderPostponeSchema,
  serviceOrderTechnicianSchema,
  todayInputValue,
} from "@/schemas/serviceOrders";
import type { ServiceOrderItem } from "@/types/serviceOrders";

const NOW = new Date("2026-07-07T12:00:00.000Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

function item(overrides: Partial<ServiceOrderItem> = {}): ServiceOrderItem {
  return {
    id: "OS-2026-0001",
    productName: "Link Dedicado",
    status: "pending",
    address: "Rua A, 1 — São Paulo/SP",
    slaDeadline: new Date(NOW + 2 * DAY).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
    evidences: [{}, {}, {}],
    reschedulesUsed: 0,
    reschedulesAllowed: 3,
    amount: { amount: 100, currency: "BRL" },
    messages: [],
    ...overrides,
  };
}

const registered = { fileName: "foto.jpg" };

describe("ordens de serviço — regras de exibição", () => {
  it("traduz o status da ordem e da demanda para o rótulo de negócio", () => {
    const [order] = placeholderServiceOrders(NOW);
    expect(serviceOrderDisplayStatus(order)).toBe("inProgress");
    expect(
      serviceOrderDisplayStatus({
        ...order,
        status: "cancelled",
        creditIssued: true,
      }),
    ).toBe("credited");
    expect(serviceOrderDisplayStatus({ ...order, status: "cancelled" })).toBe(
      "cancelled",
    );

    const postponedTo = new Date(NOW + 10 * DAY).toISOString();
    expect(serviceOrderItemDisplayStatus(item({ postponedTo }))).toBe(
      "postponed",
    );
    // Em execução não é "Adiada", mesmo com previsão antiga.
    expect(
      serviceOrderItemDisplayStatus(
        item({ status: "inProgress", postponedTo }),
      ),
    ).toBe("inProgress");
  });

  it("conta ordens e demandas para os indicadores do topo", () => {
    const orders = placeholderServiceOrders(NOW);
    expect(summarizeServiceOrders(orders)).toEqual({
      total: 7,
      inProgress: 1,
      awaiting: 1,
      // Em espera (com jeopardy) e recusada.
      withIssue: 2,
    });
    expect(
      summarizeServiceOrderItems([
        item({ status: "inProgress" }),
        item(),
        item({ status: "held" }),
        item({ status: "inProgress", jeopardy: true }),
      ]),
    ).toEqual({ total: 4, inProgress: 2, awaiting: 1, withIssue: 2 });
  });

  it("busca sem acento nem caixa em qualquer texto", () => {
    expect(
      matchesServiceOrderSearch(["Colocação 2U", "AlphaNet"], "colocacao"),
    ).toBe(true);
    expect(matchesServiceOrderSearch(["Colocação 2U", undefined], "  ")).toBe(
      true,
    );
    expect(matchesServiceOrderSearch(["Link"], "fibra")).toBe(false);
  });

  it("evidências: progresso e conclusão só com todas registradas", () => {
    const partial = item({
      status: "inProgress",
      evidences: [registered, {}, {}],
    });
    expect(serviceOrderEvidenceProgress(partial)).toEqual({
      done: 1,
      total: 3,
      percent: 33,
    });
    expect(canCompleteServiceOrderItem(partial)).toBe(false);
    expect(
      canCompleteServiceOrderItem(
        item({
          status: "inProgress",
          evidences: [registered, registered, registered],
        }),
      ),
    ).toBe(true);
    // Pendente não conclui, mesmo com evidências.
    expect(canCompleteServiceOrderItem(item({ evidences: [registered] }))).toBe(
      false,
    );
  });

  it("iniciar exige técnico; reagendamentos não ficam negativos", () => {
    expect(canStartServiceOrderItem(item())).toBe(false);
    expect(canStartServiceOrderItem(item({ remote: true }))).toBe(false);
    expect(
      canStartServiceOrderItem(
        item({
          technician: { id: "t", name: "Ana", phone: "1", specialty: "x" },
        }),
      ),
    ).toBe(true);
    expect(remainingReschedules(item({ reschedulesUsed: 1 }))).toBe(2);
    expect(remainingReschedules(item({ reschedulesUsed: 5 }))).toBe(0);
  });

  it("progresso TMF641: etapa atual pelo status", () => {
    expect(serviceOrderProgressIndex(item())).toBe(1);
    expect(serviceOrderProgressIndex(item({ status: "inProgress" }))).toBe(2);
    expect(serviceOrderProgressIndex(item({ status: "held" }))).toBe(2);
    expect(serviceOrderProgressIndex(item({ status: "completed" }))).toBe(4);
  });

  it("dias desde e até uma data", () => {
    expect(daysSince(new Date(NOW - 3.5 * DAY).toISOString(), NOW)).toBe(3);
    expect(daysUntil(new Date(NOW + 2.1 * DAY).toISOString(), NOW)).toBe(3);
    expect(daysUntil(new Date(NOW - DAY).toISOString(), NOW)).toBe(0);
    expect(daysSince("inválida", NOW)).toBe(0);
  });
});

describe("ordens de serviço — formulários", () => {
  const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return todayInputValue(date);
  };

  it("adiar: data futura, horário e motivo; reagendar exige tipo e motivo", async () => {
    const base = {
      date: tomorrow(),
      time: "09:00",
      reason: "Cliente pediu",
      reschedule: false,
    };
    await expect(serviceOrderPostponeSchema.isValid(base)).resolves.toBe(true);
    await expect(
      serviceOrderPostponeSchema.isValid({ ...base, date: "2000-01-01" }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderPostponeSchema.isValid({ ...base, time: "25:00" }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderPostponeSchema.isValid({ ...base, reason: " " }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderPostponeSchema.isValid({
        ...base,
        reschedule: true,
        rescheduleType: "internal",
        rescheduleReason: "",
      }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderPostponeSchema.isValid({
        ...base,
        reschedule: true,
        rescheduleType: "buyerRequest",
        rescheduleReason: "Reforma no prédio",
      }),
    ).resolves.toBe(true);
  });

  it("técnico novo: nome, telefone válido e especialidade; e-mail opcional", async () => {
    const valid = {
      name: "Pedro Ortega",
      email: "",
      phone: "(85) 99999-9999",
      specialty: "Fibra",
    };
    await expect(serviceOrderTechnicianSchema.isValid(valid)).resolves.toBe(
      true,
    );
    await expect(
      serviceOrderTechnicianSchema.isValid({ ...valid, phone: "(85) 9999" }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderTechnicianSchema.isValid({ ...valid, email: "pedro@" }),
    ).resolves.toBe(false);
    await expect(
      serviceOrderTechnicianSchema.isValid({ ...valid, specialty: "" }),
    ).resolves.toBe(false);
  });
});
