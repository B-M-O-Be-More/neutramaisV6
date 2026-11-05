import { describe, expect, it } from "vitest";

import {
  formatProposalMoney,
  hoursUntil,
  moneyInputValue,
  sellerInitials,
} from "@/functions/proposalFormat";

describe("proposalFormat", () => {
  it("formata o preço com o símbolo da moeda da proposta", () => {
    expect(
      formatProposalMoney({ amount: 1850, currency: "BRL" }, "pt-BR"),
    ).toBe("R$ 1.850,00");
    expect(
      formatProposalMoney({ amount: 4500, currency: "USD" }, "pt-BR"),
    ).toBe("US$ 4.500,00");
  });

  it("prepara o valor para o campo com máscara de dinheiro", () => {
    expect(moneyInputValue(1850)).toBe("1.850,00");
    expect(moneyInputValue(980.5)).toBe("980,50");
  });

  it("usa as duas primeiras letras do nome do seller", () => {
    expect(sellerInitials("SpeedLine Telecom")).toBe("SP");
    expect(sellerInitials("  é-Net")).toBe("ÉN");
  });

  it("conta as horas até o prazo, arredondando para cima", () => {
    const now = Date.UTC(2026, 6, 7, 10, 0);
    expect(
      hoursUntil(new Date(now + 17.5 * 3_600_000).toISOString(), now),
    ).toBe(18);
    expect(hoursUntil(new Date(now - 1).toISOString(), now)).toBe(0);
    expect(hoursUntil("invalid", now)).toBe(0);
  });
});
