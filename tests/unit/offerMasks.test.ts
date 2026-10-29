import IMask, { type FactoryOpts } from "imask";
import { describe, expect, it } from "vitest";

import {
  DIGITS_MASK,
  MONEY_MASK,
  PERCENT_MASK,
} from "@/components/OfferMaskedInput";

/** Simula digitação/colagem: o texto entra como input do usuário. */
function typed(options: FactoryOpts, text: string): string {
  const mask = IMask.createMask(options);
  mask.append(text, { input: true, raw: true });
  return mask.value;
}

describe("máscaras do assistente de oferta", () => {
  it("DIGITS_MASK aceita só dígitos", () => {
    expect(typed(DIGITS_MASK, "500")).toBe("500");
    // Letras são descartadas, os dígitos ficam.
    expect(IMask.createPipe(DIGITS_MASK)("5a0b0")).toBe("500");
  });

  it.each([
    ["98,5", "98,5"],
    ["98.5", "98,5"],
    ["100", "100"],
    ["150", "15"],
  ])("PERCENT_MASK: %j vira %j", (input, expected) => {
    expect(typed(PERCENT_MASK, input)).toBe(expected);
  });

  it.each([
    ["1890", "1.890"],
    ["1.890,00", "1.890,00"],
    ["800,5", "800,5"],
  ])("MONEY_MASK: %j vira %j", (input, expected) => {
    expect(typed(MONEY_MASK, input)).toBe(expected);
  });
});
