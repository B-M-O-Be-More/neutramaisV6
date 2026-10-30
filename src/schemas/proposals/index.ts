import * as yup from "yup";

import { parseDecimal } from "@/functions/parseDecimal";
import {
  DEFAULT_RFQ_RESPONSE_HOURS,
  PROPOSAL_CANCEL_REASONS,
  RFQ_RESPONSE_HOURS,
} from "@/types/proposals";

/* ---------------------------------------------------------------------------
 * Propostas diretas e RFQ do buyer (Figma 2036-13698). As mensagens são
 * CHAVES de tradução (Proposals.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const SHORT_MAX = 200;
const LONG_MAX = 2000;

const optionalText = (max: number) =>
  yup.string().trim().max(max, "Proposals.errors.tooLong").default("");

const requiredText = (max: number) =>
  yup
    .string()
    .trim()
    .required("Proposals.errors.required")
    .max(max, "Proposals.errors.tooLong")
    .default("");

/** Revisão de uma proposta direta: gera a próxima versão. */
export const proposalRevisionSchema = yup.object({
  // Valor mascarado ("1.850,00"); a moeda é a da proposta e não muda.
  price: yup
    .string()
    .required("Proposals.errors.required")
    .test("positive", "Proposals.errors.priceInvalid", (value) => {
      const amount = parseDecimal(value);
      return amount !== null && amount > 0;
    })
    .default(""),
  sla: requiredText(SHORT_MAX),
  deliveryBusinessDays: yup
    .number()
    .typeError("Proposals.errors.required")
    .required("Proposals.errors.required")
    .integer("Proposals.errors.daysInvalid")
    .min(1, "Proposals.errors.daysInvalid")
    .max(365, "Proposals.errors.daysInvalid"),
  cancellationPolicy: optionalText(SHORT_MAX),
  notes: optionalText(LONG_MAX),
});

export type ProposalRevisionValues = yup.InferType<
  typeof proposalRevisionSchema
>;

/** Cancelamento de uma proposta direta: o motivo entra nas métricas. */
export const proposalCancelSchema = yup.object({
  reason: yup
    .string()
    .oneOf([...PROPOSAL_CANCEL_REASONS], "Proposals.errors.reasonRequired")
    .required("Proposals.errors.reasonRequired"),
  notes: optionalText(LONG_MAX),
});

export type ProposalCancelValues = yup.InferType<typeof proposalCancelSchema>;

/** Etapa "Detalhes" da nova RFQ. A categoria vem da etapa anterior. */
export const rfqDetailsSchema = yup.object({
  productName: requiredText(SHORT_MAX),
  description: requiredText(LONG_MAX),
  location: requiredText(SHORT_MAX),
  budget: optionalText(SHORT_MAX),
  responseHours: yup
    .number()
    .oneOf([...RFQ_RESPONSE_HOURS], "Proposals.errors.required")
    .required("Proposals.errors.required")
    .default(DEFAULT_RFQ_RESPONSE_HOURS),
  urgent: yup.boolean().default(false),
  // Anexos confidenciais não entram na RFQ — só texto (BR §7).
  requirements: optionalText(LONG_MAX),
});

export type RfqDetailsValues = yup.InferType<typeof rfqDetailsSchema>;
