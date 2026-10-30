import * as yup from "yup";

import { isValidCnpj } from "@/functions/validateCnpj";
import { isValidCpf } from "@/functions/validateCpf";

/* ---------------------------------------------------------------------------
 * Adicionar método de pagamento da carteira (Figma 2208-37661 / 2215-20243).
 * As mensagens são CHAVES de tradução (Wallet.addMethod.errors.*).
 *
 * PIX: tipo de chave + chave no formato do tipo. Cartão: número (Luhn),
 * nome impresso, validade futura e CVV. Só os campos do tipo escolhido são
 * validados; o formato só é conferido quando há valor (vazio é o `required`).
 * ------------------------------------------------------------------------- */

export const PAYMENT_METHOD_TYPES = ["pix", "card"] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const PIX_KEY_TYPES = [
  "cnpj",
  "cpf",
  "email",
  "phone",
  "random",
] as const;
export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

/** Máscara (react-imask) de cada tipo de chave. E-mail não tem máscara. */
export const PIX_KEY_MASKS: Record<PixKeyType, string | RegExp | undefined> = {
  cnpj: "00.000.000/0000-00",
  cpf: "000.000.000-00",
  email: undefined,
  phone: "(00) 00000-0000",
  random: /^[0-9a-fA-F-]{0,36}$/,
};

export const CARD_NUMBER_MASK = "0000 0000 0000 0000[ 000]";
export const CARD_EXPIRY_MASK = "00/00";
export const CARD_CVV_MASK = "000[0]";

// Chave aleatória (EVP) do PIX: UUID.
const RANDOM_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Algoritmo de Luhn sobre os dígitos do cartão (13 a 19). */
export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = parseInt(digits[digits.length - 1 - i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** "MM/AA" com mês válido e ainda não vencido em `now`. */
export function isValidCardExpiry(value: string, now = new Date()): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // O cartão vale até o último dia do mês da validade.
  return new Date(year, month, 1) > now;
}

export function isValidPixKey(type: PixKeyType, value: string): boolean {
  switch (type) {
    case "cnpj":
      return isValidCnpj(value);
    case "cpf":
      return isValidCpf(value);
    case "email":
      return yup.string().email().isValidSync(value) && value.includes(".");
    case "phone":
      return value.replace(/\D/g, "").length === 11;
    case "random":
      return RANDOM_KEY_PATTERN.test(value);
  }
}

const isPix = (type: PaymentMethodType) => type === "pix";
const isCard = (type: PaymentMethodType) => type === "card";

export const paymentMethodSchema = yup.object({
  methodType: yup
    .mixed<PaymentMethodType>()
    .oneOf(PAYMENT_METHOD_TYPES)
    .required()
    .default("pix"),
  pixKeyType: yup
    .mixed<PixKeyType>()
    .oneOf(PIX_KEY_TYPES)
    .required()
    .default("cnpj"),
  pixKey: yup
    .string()
    .trim()
    .default("")
    .when("methodType", {
      is: isPix,
      then: (schema) =>
        schema
          .required("Wallet.addMethod.errors.pixKeyRequired")
          .test(
            "pix-key",
            "Wallet.addMethod.errors.pixKeyInvalid",
            function (value) {
              return !value || isValidPixKey(this.parent.pixKeyType, value);
            },
          ),
    }),
  cardNumber: yup
    .string()
    .default("")
    .when("methodType", {
      is: isCard,
      then: (schema) =>
        schema
          .required("Wallet.addMethod.errors.cardNumberRequired")
          .test(
            "card-number",
            "Wallet.addMethod.errors.cardNumberInvalid",
            (value) => !value || isValidCardNumber(value),
          ),
    }),
  cardName: yup
    .string()
    .trim()
    .default("")
    .when("methodType", {
      is: isCard,
      then: (schema) =>
        schema
          .required("Wallet.addMethod.errors.cardNameRequired")
          .test(
            "card-name",
            "Wallet.addMethod.errors.cardNameInvalid",
            (value) => !value || (value.length >= 3 && value.length <= 26),
          ),
    }),
  cardExpiry: yup
    .string()
    .default("")
    .when("methodType", {
      is: isCard,
      then: (schema) =>
        schema
          .required("Wallet.addMethod.errors.cardExpiryRequired")
          .test(
            "card-expiry",
            "Wallet.addMethod.errors.cardExpiryInvalid",
            (value) => !value || isValidCardExpiry(value),
          ),
    }),
  cardCvv: yup
    .string()
    .default("")
    .when("methodType", {
      is: isCard,
      then: (schema) =>
        schema
          .required("Wallet.addMethod.errors.cardCvvRequired")
          .matches(/^\d{3,4}$/, {
            message: "Wallet.addMethod.errors.cardCvvInvalid",
            excludeEmptyString: true,
          }),
    }),
});

export type PaymentMethodValues = yup.InferType<typeof paymentMethodSchema>;
