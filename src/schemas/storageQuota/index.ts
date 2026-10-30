import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * Alteração da cota de armazenamento de cobertura (área admin, Figma
 * 2902-99727). As mensagens são CHAVES de tradução
 * (CoverageStorage.quota.errors.*).
 *
 * MB inteiros de 50 a 1000, como o slider do design. A geo-api aceita de 0 a
 * 1000 com até seis casas decimais: a faixa daqui cabe nela.
 * ------------------------------------------------------------------------- */

export const STORAGE_QUOTA_MIN_MB = 50;
export const STORAGE_QUOTA_MAX_MB = 1000;
export const STORAGE_QUOTA_REASON_MIN = 10;
export const STORAGE_QUOTA_REASON_MAX = 500;

/** Cota atual dentro da faixa do formulário (ponto de partida do slider). */
export function clampQuotaMb(value: number): number {
  return Math.min(
    STORAGE_QUOTA_MAX_MB,
    Math.max(STORAGE_QUOTA_MIN_MB, Math.round(value)),
  );
}

export const storageQuotaSchema = yup.object({
  quotaMb: yup
    .number()
    .typeError("CoverageStorage.quota.errors.quotaRequired")
    .required("CoverageStorage.quota.errors.quotaRequired")
    .integer("CoverageStorage.quota.errors.quotaInvalid")
    .min(STORAGE_QUOTA_MIN_MB, "CoverageStorage.quota.errors.quotaRange")
    .max(STORAGE_QUOTA_MAX_MB, "CoverageStorage.quota.errors.quotaRange"),
  // O motivo fica na auditoria da alteração na geo-api.
  reason: yup
    .string()
    .trim()
    .required("CoverageStorage.quota.errors.reasonRequired")
    .min(
      STORAGE_QUOTA_REASON_MIN,
      "CoverageStorage.quota.errors.reasonTooShort",
    )
    .max(STORAGE_QUOTA_REASON_MAX, "CoverageStorage.quota.errors.reasonTooLong")
    .default(""),
});

export type StorageQuotaValues = yup.InferType<typeof storageQuotaSchema>;
