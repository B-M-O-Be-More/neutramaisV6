import { describe, expect, it } from "vitest";

import { getPasswordStrength } from "@/functions/passwordStrength";

describe("getPasswordStrength", () => {
  it("classifica senha vazia como fraca", () => {
    const result = getPasswordStrength("");
    expect(result).toMatchObject({
      level: "weak",
      value: 33,
      step: 1,
      colorPalette: "red",
    });
  });

  it("classifica como fraca quando atinge no máximo 1 critério", () => {
    // Apenas comprimento >= 8 (sem maiúsculas, números ou símbolos).
    expect(getPasswordStrength("abcdefgh").level).toBe("weak");
  });

  it("classifica como média entre 2 e 3 critérios", () => {
    // Comprimento + número = 2 critérios.
    expect(getPasswordStrength("abcdefg1")).toMatchObject({
      level: "medium",
      value: 66,
      step: 2,
      colorPalette: "orange",
    });

    // Comprimento + caixa mista + número = 3 critérios.
    expect(getPasswordStrength("Abcdefg1").level).toBe("medium");
  });

  it("classifica como forte quando atinge os 4 critérios", () => {
    expect(getPasswordStrength("Abcdefg1!")).toMatchObject({
      level: "strong",
      value: 100,
      step: 3,
      colorPalette: "green",
    });
  });
});
