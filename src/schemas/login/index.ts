import * as yup from "yup";

/* ---------------------------------------------------------------------------
 * US-01 — Login
 * As mensagens são CHAVES de tradução (Login.errors.*) e são traduzidas no
 * momento da exibição (t(message)), mantendo o schema/tipos estáticos.
 * ------------------------------------------------------------------------- */
export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Login.errors.emailInvalid")
    .required("Login.errors.emailRequired"),
  password: yup.string().required("Login.errors.passwordRequired"),
  rememberMe: yup.boolean().default(false),
});
