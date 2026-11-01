import { describe, expect, it } from "vitest";

import { isValidCpf } from "@/functions/validateCpf";
import {
  isValidCardExpiry,
  isValidCardNumber,
  isValidPixKey,
  paymentMethodSchema,
} from "@/schemas/paymentMethod";

const errorsOf = async (values: Record<string, unknown>) => {
  try {
    await paymentMethodSchema.validate(
      { ...paymentMethodSchema.getDefault(), ...values },
      { abortEarly: false },
    );
    return [];
  } catch (error) {
    return (error as { errors: string[] }).errors;
  }
};

describe("validações do método de pagamento", () => {
  it("valida o cartão pelo algoritmo de Luhn", () => {
    expect(isValidCardNumber("4111 1111 1111 1111")).toBe(true);
    expect(isValidCardNumber("4111 1111 1111 1112")).toBe(false);
    expect(isValidCardNumber("4111 1111")).toBe(false);
  });

  it("aceita validade futura e recusa mês inválido ou vencido", () => {
    const now = new Date("2026-10-29T12:00:00");

    expect(isValidCardExpiry("10/26", now)).toBe(true);
    expect(isValidCardExpiry("09/28", now)).toBe(true);
    expect(isValidCardExpiry("09/26", now)).toBe(false);
    expect(isValidCardExpiry("13/28", now)).toBe(false);
    expect(isValidCardExpiry("1/28", now)).toBe(false);
  });

  it("confere os dígitos do CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-26")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("valida a chave PIX conforme o tipo", () => {
    expect(isValidPixKey("cnpj", "14.523.777/0001-88")).toBe(false);
    expect(isValidPixKey("cnpj", "11.222.333/0001-81")).toBe(true);
    expect(isValidPixKey("cpf", "529.982.247-25")).toBe(true);
    expect(isValidPixKey("email", "financeiro@empresa.com.br")).toBe(true);
    expect(isValidPixKey("email", "financeiro@empresa")).toBe(false);
    expect(isValidPixKey("phone", "(85) 99999-1234")).toBe(true);
    expect(isValidPixKey("phone", "(85) 9999-1234")).toBe(false);
    expect(
      isValidPixKey("random", "123e4567-e89b-12d3-a456-426614174000"),
    ).toBe(true);
    expect(isValidPixKey("random", "123e4567")).toBe(false);
  });
});

describe("paymentMethodSchema", () => {
  it("no PIX, exige só a chave", async () => {
    expect(await errorsOf({ methodType: "pix" })).toEqual([
      "Wallet.addMethod.errors.pixKeyRequired",
    ]);
    expect(
      await errorsOf({ methodType: "pix", pixKeyType: "cpf", pixKey: "123" }),
    ).toEqual(["Wallet.addMethod.errors.pixKeyInvalid"]);
    expect(
      await errorsOf({
        methodType: "pix",
        pixKeyType: "cpf",
        pixKey: "529.982.247-25",
      }),
    ).toEqual([]);
  });

  it("no cartão, exige número, nome, validade e CVV", async () => {
    expect(await errorsOf({ methodType: "card" })).toEqual([
      "Wallet.addMethod.errors.cardNumberRequired",
      "Wallet.addMethod.errors.cardNameRequired",
      "Wallet.addMethod.errors.cardExpiryRequired",
      "Wallet.addMethod.errors.cardCvvRequired",
    ]);
    expect(
      await errorsOf({
        methodType: "card",
        cardNumber: "4111 1111 1111 1111",
        cardName: "MARIA AZEVEDO",
        cardExpiry: "12/40",
        cardCvv: "12",
      }),
    ).toEqual(["Wallet.addMethod.errors.cardCvvInvalid"]);
  });
});
