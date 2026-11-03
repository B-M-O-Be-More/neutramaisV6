import { describe, expect, it } from "vitest";

import {
  cnpjFromNfeAccessKey,
  formatNfeAccessKey,
  isValidNfeAccessKey,
} from "@/functions/nfeAccessKey";

// Chave do exemplo da documentação da orders-api (dígito verificador 3).
const KEY = "23261012345678000195550010000045121482139073";

describe("chave de acesso da NF-e", () => {
  it("aceita a chave com o dígito verificador certo, com ou sem espaços", () => {
    expect(isValidNfeAccessKey(KEY)).toBe(true);
    expect(isValidNfeAccessKey(formatNfeAccessKey(KEY))).toBe(true);
  });

  it("recusa dígito verificador errado e tamanho errado", () => {
    expect(isValidNfeAccessKey(`${KEY.slice(0, 43)}4`)).toBe(false);
    expect(isValidNfeAccessKey(KEY.slice(0, 43))).toBe(false);
    expect(isValidNfeAccessKey(`${KEY}1`)).toBe(false);
    expect(isValidNfeAccessKey("")).toBe(false);
  });

  it("resto 0 ou 1 vira dígito 0", () => {
    // 43 zeros: soma 0, resto 0 → dígito 0.
    expect(isValidNfeAccessKey(`${"0".repeat(43)}0`)).toBe(true);
    expect(isValidNfeAccessKey(`${"0".repeat(43)}1`)).toBe(false);
  });

  it("lê o CNPJ do emitente nas posições 7 a 20", () => {
    expect(cnpjFromNfeAccessKey(KEY)).toBe("12345678000195");
    expect(cnpjFromNfeAccessKey("123")).toBeNull();
  });

  it("formata em blocos de 4, como no DANFE, e corta no 44º dígito", () => {
    expect(formatNfeAccessKey(KEY)).toBe(
      "2326 1012 3456 7800 0195 5500 1000 0045 1214 8213 9073",
    );
    expect(formatNfeAccessKey(`${KEY}99`)).toBe(formatNfeAccessKey(KEY));
    expect(formatNfeAccessKey("2326a1012")).toBe("2326 1012");
  });
});
