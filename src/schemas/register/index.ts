import * as yup from "yup";

import { isValidCnpj } from "@/functions/validateCnpj";

/* ---------------------------------------------------------------------------
 * US-02 — Cadastro de Empresa (KYC Básico)
 * Schemas por etapa do stepper. As etapas 1–3 são compartilhadas por
 * comprador (Payer) e vendedor (Seller); a etapa 4 (Documentos) é só do Seller.
 *
 * As mensagens são CHAVES de tradução (Register.errors.*) e são traduzidas
 * no momento da exibição (t(message)), mantendo o schema/tipos estáticos.
 * ------------------------------------------------------------------------- */

/** Etapa 1 — Dados da Empresa */
export const companyDataSchema = yup.object({
  companyName: yup.string().trim().required("Register.errors.companyName"),
  document: yup
    .string()
    .trim()
    .required("Register.errors.documentRequired")
    .test(
      "document-format",
      "Register.errors.documentInvalid",
      (value, ctx) => {
        if (!value) return false;
        // Validação local de dígitos verificadores apenas para BR.
        if (ctx.parent.country === "BR") return isValidCnpj(value);
        // TODO: validar tax IDs internacionais (NIF, EIN, VAT) via country_tax_id_format.
        return true;
      },
    ),
  country: yup.string().required("Register.errors.country"),
  phone: yup.string().trim().required("Register.errors.phone"),
  sector: yup.string().required("Register.errors.sector"),
});

/** Etapa 2 — Endereço */
export const addressSchema = yup.object({
  zipCode: yup.string().trim().required("Register.errors.zipCode"),
  street: yup.string().trim().required("Register.errors.street"),
  number: yup.string().trim().required("Register.errors.number"),
  complement: yup.string().trim().default(""),
  neighborhood: yup.string().trim().required("Register.errors.neighborhood"),
  city: yup.string().trim().required("Register.errors.city"),
  state: yup.string().trim().required("Register.errors.state"),
});

/** Etapa 3 — Responsável (vira Admin da Empresa) */
export const responsibleSchema = yup.object({
  responsibleName: yup
    .string()
    .trim()
    .required("Register.errors.responsibleName"),
  email: yup
    .string()
    .trim()
    .email("Register.errors.emailInvalid")
    .required("Register.errors.emailRequired"),
  password: yup
    .string()
    .required("Register.errors.passwordRequired")
    .min(8, "Register.errors.passwordMin")
    .matches(/[a-zA-Z]/, "Register.errors.passwordLetter")
    .matches(/[0-9]/, "Register.errors.passwordNumber"),
  confirmPassword: yup
    .string()
    .required("Register.errors.confirmRequired")
    .oneOf([yup.ref("password")], "Register.errors.confirmMatch"),
  // Clickwrap (Tema 11) — aceite obrigatório.
  acceptTerms: yup
    .boolean()
    .default(false)
    .oneOf([true], "Register.errors.acceptTerms"),
});

/** Etapa 4 — Documentos (apenas Seller / KYC verified_seller) */
export const documentsSchema = yup.object({
  // TODO: definir e exigir os documentos do KYC de vendedor (contrato social etc.).
  documents: yup.array(yup.mixed<File>().required()).default([]),
});

/** Comprador (Payer): etapas 1–3 */
export const registerPayerSchema = companyDataSchema
  .concat(addressSchema)
  .concat(responsibleSchema);

/** Vendedor (Seller): etapas 1–4 */
export const registerSellerSchema = registerPayerSchema.concat(documentsSchema);
