import { describe, expect, it } from "vitest";

import { getPasswordStrength } from "@/functions/passwordStrength";

// Os critérios espelham a política da identity-api: 12+ caracteres, caixa mista,
// dígito e símbolo (ver src/schemas/password).
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
    // Apenas comprimento >= 12 (sem maiúsculas, números ou símbolos).
    expect(getPasswordStrength("abcdefghijkl").level).toBe("weak");
  });

  it("não pontua comprimento abaixo do mínimo da política", () => {
    // 9 caracteres com caixa mista, número e símbolo: 3 critérios, não 4 —
    // o servidor recusaria por comprimento, então não pode aparecer como forte.
    expect(getPasswordStrength("Abcdefg1!")).toMatchObject({
      level: "medium",
      step: 2,
    });
  });

  it("classifica como média entre 2 e 3 critérios", () => {
    // Comprimento + número = 2 critérios.
    expect(getPasswordStrength("abcdefghijk1")).toMatchObject({
      level: "medium",
      value: 66,
      step: 2,
      colorPalette: "orange",
    });

    // Comprimento + caixa mista + número = 3 critérios.
    expect(getPasswordStrength("Abcdefghijk1").level).toBe("medium");
  });

  it("classifica como forte quando atinge os 4 critérios", () => {
    expect(getPasswordStrength("Abcdefghijk1!")).toMatchObject({
      level: "strong",
      value: 100,
      step: 3,
      colorPalette: "green",
    });
  });
});
