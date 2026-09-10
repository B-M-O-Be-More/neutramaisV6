import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * US-01 — Verificação em duas etapas (desafio de MFA do login)
 * As mensagens são CHAVES de tradução (Mfa.errors.*) e são traduzidas no
 * momento da exibição (t(message)), mantendo o schema/tipos estáticos.
 *
 * O artefato aceita EXATAMENTE UM de totp_code | recovery_code. Modelamos como
 * dois schemas separados porque a tela alterna entre os dois modos — assim cada
 * modo valida só o próprio campo e nunca é possível montar um payload com os
 * dois preenchidos.
 * ------------------------------------------------------------------------- */

/** TOTP do app autenticador: exatamente 6 dígitos (^\d{6}$). */
export const mfaTotpSchema = yup.object({
  totpCode: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "Mfa.errors.totpInvalid")
    .required("Mfa.errors.totpRequired"),
});

/**
 * Código de recuperação. O artefato não publica o formato, então validamos só a
 * presença — deixamos o upstream ser a autoridade e recusar com
 * 401 INVALID_MFA_CODE.
 */
export const mfaRecoverySchema = yup.object({
  recoveryCode: yup.string().trim().required("Mfa.errors.recoveryRequired"),
});
