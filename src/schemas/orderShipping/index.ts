import * as yup from "yup";

import { isValidNfeAccessKey, onlyDigits } from "@/functions/nfeAccessKey";
import { parseDecimal } from "@/functions/parseDecimal";

/* ---------------------------------------------------------------------------
 * Envio do pedido físico pelo Seller: anexar a NF e informar o rastreio. As
 * regras são as da orders-api (developer-portal, rotas de envio) e as
 * mensagens são CHAVES de tradução (OrderShipping.errors.*).
 * ------------------------------------------------------------------------- */

const REQUIRED = "OrderShipping.errors.required";
const TOO_LONG = "OrderShipping.errors.tooLong";

const text = (min: number, max: number) =>
  yup
    .string()
    .trim()
    .required(REQUIRED)
    .min(min, "OrderShipping.errors.tooShort")
    .max(max, TOO_LONG)
    .default("");

const digits = (lengths: number[], message: string) =>
  yup
    .string()
    .trim()
    .required(REQUIRED)
    .test("digits", message, (value) =>
      lengths.includes(onlyDigits(value ?? "").length),
    )
    .default("");

const phone = () =>
  yup
    .string()
    .trim()
    .required(REQUIRED)
    .test("phone", "OrderShipping.errors.phoneInvalid", (value) => {
      const length = onlyDigits(value ?? "").length;
      return length >= 10 && length <= 13;
    })
    .default("");

const email = () =>
  yup
    .string()
    .trim()
    .required(REQUIRED)
    .email("OrderShipping.errors.emailInvalid")
    .min(5, "OrderShipping.errors.emailInvalid")
    .max(150, TOO_LONG)
    .default("");

/** "Anexar nota fiscal": PDF, chave, valor, remetente e destinatário. */
export const orderInvoiceSchema = yup.object({
  file: yup
    .mixed<File>()
    .required("OrderShipping.errors.fileRequired")
    .test(
      "file",
      "OrderShipping.errors.fileRequired",
      (value) => value instanceof File,
    ),
  accessKey: yup
    .string()
    .trim()
    .required(REQUIRED)
    .test("nfe", "OrderShipping.errors.accessKeyInvalid", (value) =>
      isValidNfeAccessKey(value ?? ""),
    )
    .default(""),
  // Valor mascarado ("779,80"); em reais, vira centavos no envio.
  value: yup
    .string()
    .required(REQUIRED)
    .test("positive", "OrderShipping.errors.valueInvalid", (value) => {
      const amount = parseDecimal(value);
      return amount !== null && amount > 0;
    })
    .default(""),
  senderName: text(2, 150),
  stateRegister: text(1, 30),
  postalCode: digits([8], "OrderShipping.errors.postalCodeInvalid"),
  address: text(2, 200),
  number: text(1, 20),
  district: text(2, 100),
  city: text(2, 100),
  stateAbbr: yup
    .string()
    .trim()
    .required(REQUIRED)
    .matches(/^[A-Za-z]{2}$/, "OrderShipping.errors.stateInvalid")
    .default(""),
  senderPhone: phone(),
  senderEmail: email(),
  complement: yup.string().trim().max(150, TOO_LONG).default(""),
  economicActivityCode: yup
    .string()
    .trim()
    .test(
      "cnae",
      "OrderShipping.errors.cnaeInvalid",
      (value) => !value || /^\d{7}$/.test(onlyDigits(value)),
    )
    .default(""),
  recipientDocument: digits([11, 14], "OrderShipping.errors.documentInvalid"),
  recipientEmail: email(),
  recipientPhone: phone(),
});

export type OrderInvoiceValues = yup.InferType<typeof orderInvoiceSchema>;

/** Código de rastreio: 5 a 64 letras, dígitos ou hífen. */
export const orderTrackingSchema = yup.object({
  code: yup
    .string()
    .trim()
    .required(REQUIRED)
    .matches(/^[A-Za-z0-9-]{5,64}$/, "OrderShipping.errors.trackingInvalid")
    .default(""),
});

export type OrderTrackingValues = yup.InferType<typeof orderTrackingSchema>;
