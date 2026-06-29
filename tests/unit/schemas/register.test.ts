import { describe, expect, it } from "vitest";

import {
  addressSchema,
  companyDataSchema,
  registerPayerSchema,
  responsibleSchema,
} from "@/schemas/register";

// Etapa 1 válida para BR (CNPJ com dígitos verificadores corretos).
const validCompanyBR = {
  companyName: "BMO Telecom",
  document: "11222333000181",
  country: "BR",
  phone: "+55 (11) 99999-9999",
  sector: "telecom",
};

const validAddress = {
  zipCode: "01310-100",
  street: "Av. Paulista",
  number: "1000",
  complement: "",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

const validResponsible = {
  responsibleName: "João da Silva",
  email: "joao@bmo.dev.br",
  password: "senha1234",
  confirmPassword: "senha1234",
  acceptTerms: true,
};

describe("companyDataSchema", () => {
  it("valida uma empresa BR com CNPJ correto", async () => {
    await expect(
      companyDataSchema.validate(validCompanyBR),
    ).resolves.toBeDefined();
  });

  it("rejeita CNPJ inválido quando o país é BR", async () => {
    await expect(
      companyDataSchema.validate({
        ...validCompanyBR,
        document: "11222333000182",
      }),
    ).rejects.toThrow("Register.errors.documentInvalid");
  });

  it("não aplica validação de CNPJ para países fora do BR", async () => {
    await expect(
      companyDataSchema.validate({
        ...validCompanyBR,
        country: "US",
        document: "EIN-123456",
      }),
    ).resolves.toBeDefined();
  });

  it("exige o nome da empresa", async () => {
    await expect(
      companyDataSchema.validate({ ...validCompanyBR, companyName: "" }),
    ).rejects.toThrow("Register.errors.companyName");
  });
});

describe("addressSchema", () => {
  it("valida um endereço completo", async () => {
    await expect(addressSchema.validate(validAddress)).resolves.toBeDefined();
  });

  it("aceita complemento vazio (campo opcional)", async () => {
    const result = await addressSchema.validate(validAddress);
    expect(result.complement).toBe("");
  });

  it("exige o CEP", async () => {
    await expect(
      addressSchema.validate({ ...validAddress, zipCode: "" }),
    ).rejects.toThrow("Register.errors.zipCode");
  });
});

describe("responsibleSchema", () => {
  it("valida um responsável correto", async () => {
    await expect(
      responsibleSchema.validate(validResponsible),
    ).resolves.toBeDefined();
  });

  it("rejeita senha com menos de 8 caracteres", async () => {
    await expect(
      responsibleSchema.validate({
        ...validResponsible,
        password: "abc12",
        confirmPassword: "abc12",
      }),
    ).rejects.toThrow("Register.errors.passwordMin");
  });

  it("rejeita quando a confirmação de senha não confere", async () => {
    await expect(
      responsibleSchema.validate({
        ...validResponsible,
        confirmPassword: "outra1234",
      }),
    ).rejects.toThrow("Register.errors.confirmMatch");
  });

  it("exige o aceite dos termos (clickwrap)", async () => {
    await expect(
      responsibleSchema.validate({ ...validResponsible, acceptTerms: false }),
    ).rejects.toThrow("Register.errors.acceptTerms");
  });

  it("rejeita email em formato inválido", async () => {
    await expect(
      responsibleSchema.validate({ ...validResponsible, email: "nao-e-email" }),
    ).rejects.toThrow("Register.errors.emailInvalid");
  });
});

describe("registerPayerSchema", () => {
  it("valida o cadastro completo do comprador (etapas 1–3)", async () => {
    await expect(
      registerPayerSchema.validate({
        ...validCompanyBR,
        ...validAddress,
        ...validResponsible,
      }),
    ).resolves.toBeDefined();
  });
});
