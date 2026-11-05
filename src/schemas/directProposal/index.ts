import * as yup from "yup";

import { parseDecimal } from "@/functions/parseDecimal";

/* ---------------------------------------------------------------------------
 * "Fazer Proposta" de uma oferta do Buscar Rede (Figma 2456-32149). As
 * mensagens são CHAVES de tradução (SearchNetwork.proposal.errors.*),
 * traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const SHORT_MAX = 200;
const LONG_MAX = 2000;

export const DIRECT_PROPOSAL_MAX_MONTHS = 120;
export const DIRECT_PROPOSAL_MAX_PORTS = 100_000;
export const DIRECT_PROPOSAL_ATTACHMENTS_MAX = 5;
export const DIRECT_PROPOSAL_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** PDF, DOCX e XLSX (Figma 2456-37186). */
export const DIRECT_PROPOSAL_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const required = "SearchNetwork.proposal.errors.required";
const tooLong = "SearchNetwork.proposal.errors.tooLong";

const shortText = () =>
  yup.string().trim().required(required).max(SHORT_MAX, tooLong).default("");

/**
 * O mínimo de portas vem da oferta (`metadata.minPorts`); sem ele, 1.
 */
export function directProposalSchema(minPorts = 1) {
  return yup.object({
    street: shortText(),
    number: yup.string().trim().required(required).max(20, tooLong).default(""),
    postalCode: yup
      .string()
      .required(required)
      .matches(/^\d{5}-\d{3}$/, "SearchNetwork.proposal.errors.postalCode")
      .default(""),
    ports: yup
      .number()
      .typeError(required)
      .required(required)
      .integer("SearchNetwork.proposal.errors.integer")
      .min(minPorts, "SearchNetwork.proposal.errors.portsMin")
      .max(DIRECT_PROPOSAL_MAX_PORTS, "SearchNetwork.proposal.errors.integer"),
    contractMonths: yup
      .number()
      .typeError(required)
      .required(required)
      .integer("SearchNetwork.proposal.errors.integer")
      .min(1, "SearchNetwork.proposal.errors.monthsInvalid")
      .max(
        DIRECT_PROPOSAL_MAX_MONTHS,
        "SearchNetwork.proposal.errors.monthsInvalid",
      ),
    // Valor mascarado ("1.200,00"); a moeda é sempre BRL.
    price: yup
      .string()
      .required(required)
      .test(
        "positive",
        "SearchNetwork.proposal.errors.priceInvalid",
        (value) => {
          const amount = parseDecimal(value);
          return amount !== null && amount > 0;
        },
      )
      .default(""),
    sla: shortText(),
    delivery: shortText(),
    cancellation: yup
      .string()
      .trim()
      .required(required)
      .max(500, tooLong)
      .default(""),
    requiresSiteSurvey: yup.boolean().default(false),
    message: yup.string().trim().max(LONG_MAX, tooLong).default(""),
    attachments: yup
      .array(yup.mixed<File>().required())
      .max(
        DIRECT_PROPOSAL_ATTACHMENTS_MAX,
        "SearchNetwork.proposal.errors.tooManyFiles",
      )
      .test(
        "file-size",
        "SearchNetwork.proposal.errors.fileTooLarge",
        (files) =>
          !files ||
          files.every(
            (file) => file.size <= DIRECT_PROPOSAL_ATTACHMENT_MAX_BYTES,
          ),
      )
      .default([]),
  });
}

export type DirectProposalValues = yup.InferType<
  ReturnType<typeof directProposalSchema>
>;
