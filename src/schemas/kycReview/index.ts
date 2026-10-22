import * as yup from "yup";

import {
  KYC_ACCOUNT_DECISIONS,
  KYC_ACCOUNT_REASON_CODES,
  KYC_DOCUMENT_REASON_CODES,
} from "@/services/adminKycReview.service";

/* ---------------------------------------------------------------------------
 * Revisão de KYC do admin — recusa de documento e decisão da conta.
 * Espelha as regras da compliance-api (tamanhos e campos condicionais). As
 * mensagens são CHAVES de tradução (Admin.review.form.errors.*), traduzidas
 * no momento da exibição (t(message)).
 * ------------------------------------------------------------------------- */

const NOTE_MAX = 1000;
const INSTRUCTIONS_MAX = 2000;

const note = yup
  .string()
  .trim()
  .max(NOTE_MAX, "Admin.review.form.errors.tooLong")
  .default("");

export const documentRejectSchema = yup.object({
  reasonCode: yup
    .string()
    .oneOf(
      [...KYC_DOCUMENT_REASON_CODES],
      "Admin.review.form.errors.reasonRequired",
    )
    .required("Admin.review.form.errors.reasonRequired"),
  // Obrigatório com "other" (só espaços contam como vazio).
  reasonDetails: note.when("reasonCode", {
    is: "other",
    then: (schema) =>
      schema.required("Admin.review.form.errors.detailsRequired"),
  }),
  reviewerNote: note,
});

export const accountDecisionSchema = yup.object({
  decision: yup
    .string()
    .oneOf(
      [...KYC_ACCOUNT_DECISIONS],
      "Admin.review.form.errors.decisionRequired",
    )
    .required("Admin.review.form.errors.decisionRequired"),
  // Motivo e detalhes só existem na recusa.
  reasonCode: yup
    .string()
    .default("")
    .when("decision", {
      is: "reject",
      then: (schema) =>
        schema
          .oneOf(
            [...KYC_ACCOUNT_REASON_CODES],
            "Admin.review.form.errors.reasonRequired",
          )
          .required("Admin.review.form.errors.reasonRequired"),
    }),
  reasonDetails: note.when(["decision", "reasonCode"], {
    is: (decision: string, reasonCode: string) =>
      decision === "reject" && reasonCode === "other",
    then: (schema) =>
      schema.required("Admin.review.form.errors.detailsRequired"),
  }),
  // Instruções vão para a organização — só (e obrigatórias) no pedido de
  // correção.
  userInstructions: yup
    .string()
    .trim()
    .max(INSTRUCTIONS_MAX, "Admin.review.form.errors.tooLong")
    .default("")
    .when("decision", {
      is: "request_correction",
      then: (schema) =>
        schema.required("Admin.review.form.errors.instructionsRequired"),
    }),
  reviewerNote: note,
});
