import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * US-03 — Recuperação de senha (solicitação do link)
 * As mensagens são CHAVES de tradução (ForgotPassword.errors.*) e são
 * traduzidas no momento da exibição (t(message)), mantendo o schema estático.
 * ------------------------------------------------------------------------- */
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("ForgotPassword.errors.emailInvalid")
    .required("ForgotPassword.errors.emailRequired"),
});
