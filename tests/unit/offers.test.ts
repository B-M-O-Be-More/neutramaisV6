import { describe, expect, it } from "vitest";

import { timeLeft, trendingCategory } from "@/functions/offers";

describe("trendingCategory", () => {
  it.each([
    [
      { name: "Fibra 500 Mega", productType: "service" as const },
      "connectivity",
    ],
    [
      { name: "Roteador Mikrotik RB4011", productType: "physical" as const },
      "hardware",
    ],
    [
      { name: "Bloco IPv4 /24 (256 IPs)", productType: "service" as const },
      "numbering",
    ],
    [{ name: "ASN dedicado", productType: undefined }, "numbering"],
    [{ name: "Colocation Rack 1U", productType: undefined }, "connectivity"],
  ])("%o → %s", (offering, expected) => {
    expect(trendingCategory(offering)).toBe(expected);
  });
});

describe("timeLeft", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");

  it("separa horas e minutos", () => {
    expect(timeLeft("2026-11-01T15:37:30Z", now)).toEqual({
      hours: 3,
      minutes: 37,
    });
  });

  it("devolve null quando o prazo venceu ou é inválido", () => {
    expect(timeLeft("2026-11-01T11:59:00Z", now)).toBeNull();
    expect(timeLeft("não é data", now)).toBeNull();
  });
});
