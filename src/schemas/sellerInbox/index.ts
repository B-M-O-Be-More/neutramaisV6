import * as yup from "yup";

import { parseDecimal } from "@/functions/parseDecimal";
import {
  DEFAULT_SELLER_RFQ_VALIDITY_DAYS,
  SELLER_RFQ_VALIDITY_DAYS,
} from "@/types/sellerRfqs";

/* ---------------------------------------------------------------------------
 * Caixa de entrada do seller (Figma 2948-50544, 2948-52347 e 3009-73726). As
 * mensagens são CHAVES de tradução (SellerOrders.errors.*), traduzidas na
 * exibição (t(message)).
 * ------------------------------------------------------------------------- */

const SHORT_MAX = 200;
const LONG_MAX = 2000;

/** Mínimo do motivo da recusa: o texto entra na auditoria. */
export const SELLER_DECLINE_MIN = 10;
/** Mínimo do pedido de complemento (Figma 3009-73761). */
export const SELLER_COMPLEMENT_MIN = 20;

/** Recusa de um pedido ou de uma RFQ: o motivo é obrigatório e auditável. */
export const sellerDeclineSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required("SellerOrders.errors.reasonRequired")
    .min(SELLER_DECLINE_MIN, "SellerOrders.errors.reasonTooShort")
    .max(LONG_MAX, "SellerOrders.errors.tooLong")
    .default(""),
});

export type SellerDeclineValues = yup.InferType<typeof sellerDeclineSchema>;

/** "Pedir complemento": o que falta para processar o pedido. */
export const sellerComplementSchema = yup.object({
  message: yup
    .string()
    .trim()
    .required("SellerOrders.errors.complementRequired")
    .min(SELLER_COMPLEMENT_MIN, "SellerOrders.errors.complementTooShort")
    .max(LONG_MAX, "SellerOrders.errors.tooLong")
    .default(""),
});

export type SellerComplementValues = yup.InferType<
  typeof sellerComplementSchema
>;

/** Proposta do seller para uma RFQ (preço em BRL, SLA, prazos e escopo). */
export const sellerRfqProposalSchema = yup.object({
  // Valor mascarado ("28.000,00"); a moeda é a da RFQ.
  price: yup
    .string()
    .required("SellerOrders.errors.required")
    .test("positive", "SellerOrders.errors.priceInvalid", (value) => {
      const amount = parseDecimal(value);
      return amount !== null && amount > 0;
    })
    .default(""),
  sla: yup
    .string()
    .trim()
    .required("SellerOrders.errors.required")
    .max(SHORT_MAX, "SellerOrders.errors.tooLong")
    .default(""),
  deliveryDays: yup
    .number()
    .typeError("SellerOrders.errors.required")
    .required("SellerOrders.errors.required")
    .integer("SellerOrders.errors.daysInvalid")
    .min(1, "SellerOrders.errors.daysInvalid")
    .max(730, "SellerOrders.errors.daysInvalid"),
  validityDays: yup
    .number()
    .oneOf([...SELLER_RFQ_VALIDITY_DAYS], "SellerOrders.errors.required")
    .required("SellerOrders.errors.required")
    .default(DEFAULT_SELLER_RFQ_VALIDITY_DAYS),
  requiresSiteSurvey: yup.boolean().default(false),
  notes: yup
    .string()
    .trim()
    .max(LONG_MAX, "SellerOrders.errors.tooLong")
    .default(""),
});

export type SellerRfqProposalValues = yup.InferType<
  typeof sellerRfqProposalSchema
>;
