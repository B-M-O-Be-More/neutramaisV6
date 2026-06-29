import { describe, expect, it } from "vitest";

import { isValidCnpj } from "@/functions/validateCnpj";

describe("isValidCnpj", () => {
  it("aceita um CNPJ válido sem formatação", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("aceita um CNPJ válido com máscara (pontos, barra e traço)", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita quando o dígito verificador está errado", () => {
    expect(isValidCnpj("11222333000182")).toBe(false);
  });

  it("rejeita quando não tem 14 dígitos", () => {
    expect(isValidCnpj("1122233300018")).toBe(false);
    expect(isValidCnpj("112223330001811")).toBe(false);
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejeita string vazia ou sem dígitos", () => {
    expect(isValidCnpj("")).toBe(false);
    expect(isValidCnpj("abc.def/ghij-kl")).toBe(false);
  });
});
