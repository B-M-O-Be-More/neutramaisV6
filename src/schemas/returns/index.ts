import * as yup from "yup";

import { RETURN_REASONS, RETURN_TYPES } from "@/types/returns";

/* ---------------------------------------------------------------------------
 * Solicitação de devolução ou troca (Figma 2943-31732). As mensagens são
 * CHAVES de tradução (Returns.errors.*), traduzidas na exibição (t(message)).
 * ------------------------------------------------------------------------- */

const LONG_MAX = 2000;
const MAX_FILES = 10;

export const returnRequestSchema = yup.object({
  type: yup
    .string()
    .oneOf([...RETURN_TYPES])
    .required()
    .default("return"),
  reason: yup
    .string()
    .oneOf([...RETURN_REASONS], "Returns.errors.reasonRequired")
    .required("Returns.errors.reasonRequired"),
  description: yup
    .string()
    .trim()
    .required("Returns.errors.descriptionRequired")
    .max(LONG_MAX, "Returns.errors.tooLong")
    .default(""),
  files: yup
    .array()
    .of(yup.mixed<File>().required())
    .max(MAX_FILES, "Returns.errors.tooManyFiles")
    .required()
    .default([]),
});

export type ReturnRequestValues = yup.InferType<typeof returnRequestSchema>;
