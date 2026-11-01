import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * Contratos do buyer (Figma 2084-12736). As mensagens são CHAVES de tradução
 * (Contracts.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const LONG_MAX = 2000;

/** Pedido de aditivo (change request): o que o buyer quer mudar. */
export const contractAmendmentSchema = yup.object({
  description: yup
    .string()
    .trim()
    .required("Contracts.errors.required")
    .max(LONG_MAX, "Contracts.errors.tooLong")
    .default(""),
});

export type ContractAmendmentValues = yup.InferType<
  typeof contractAmendmentSchema
>;
