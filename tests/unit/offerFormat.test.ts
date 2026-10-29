import { describe, expect, it } from "vitest";

import {
  formatHours,
  formatIsoDate,
  formatMoney,
  formatPercent,
} from "@/functions/offerFormat";

describe("offerFormat", () => {
  it("formata percentual, horas e dinheiro em pt-BR", () => {
    expect(formatPercent("98,5", "pt-BR")).toBe("98,5%");
    expect(formatHours("48")).toBe("48h");
    // O Intl usa espaço não separável entre o código e o valor.
    expect(formatMoney("1.890,00", "BRL", "pt-BR")?.replace(/\s/g, " ")).toBe(
      "BRL 1.890,00",
    );
  });

  it("formata a data ISO sem deslocar o dia pelo fuso", () => {
    expect(formatIsoDate("2026-12-31", "pt-BR")).toBe("31/12/2026");
    expect(formatIsoDate("2026-01-01", "pt-BR")).toBe("01/01/2026");
  });

  it("devolve undefined para valores vazios ou inválidos", () => {
    expect(formatPercent("", "pt-BR")).toBeUndefined();
    expect(formatHours("abc")).toBeUndefined();
    expect(formatMoney("", "BRL", "pt-BR")).toBeUndefined();
    expect(formatIsoDate("31/12/2026", "pt-BR")).toBeUndefined();
  });
});
